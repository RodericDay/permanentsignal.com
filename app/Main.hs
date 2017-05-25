{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE OverloadedStrings #-}
import Data.Aeson (FromJSON, ToJSON, decode, encode)
import Data.Char (isPunctuation, isSpace)
import Data.Maybe (isJust, isNothing)
import Data.Monoid (mappend)
import Data.Text (Text)
import Data.Text.Lazy (toStrict)
import Control.Exception (finally)
import Control.Monad (forM_, forever)
import Control.Concurrent (MVar, newMVar, modifyMVar_, modifyMVar, readMVar)
import GHC.Generics (Generic)
import qualified Data.Text as T
import qualified Data.Text.Lazy.Encoding as T
import qualified Network.WebSockets as WS

-- https://github.com/bos/aeson/blob/master/examples/Generic.hs
-- https://www.schoolofhaskell.com/school/starting-with-haskell/libraries-and-frameworks/text-manipulation/json
data Message = Message { kind :: Text, sender :: Text, value :: Text }
    deriving (Show, Generic)

instance FromJSON Message
instance ToJSON Message

type Client = (Text, WS.Connection)
type ServerState = [Client]

newServerState :: ServerState
newServerState = []

clientExists :: Client -> ServerState -> Bool
clientExists client = any ((== fst client) . fst)

addClient :: Client -> ServerState -> ServerState
addClient client clients = client : clients

removeClient :: Client -> ServerState -> ServerState
removeClient client = filter ((/= fst client) . fst)

sendMessage :: Message -> Client -> IO ()
sendMessage message (username, conn) = do
    WS.sendTextData conn (toStrict $ T.decodeUtf8 $ encode message)

broadcast :: Message -> ServerState -> IO ()
broadcast message clients = do
    forM_ clients $ sendMessage message

main :: IO ()
main = do
    state <- newMVar newServerState
    print "Running on port 9160"
    WS.runServer "0.0.0.0" 9160 $ application state

application :: MVar ServerState -> WS.ServerApp
application state pending = do
    conn <- WS.acceptRequest pending
    WS.forkPingThread conn 30
    login <- WS.receiveData conn
    clients <- readMVar state
    let sendError = \text -> sendMessage Message { kind = "error", sender = "server", value = text } ("", conn)
    case decode login :: Maybe Message of
        Nothing -> sendError "Communication error"
        Just message ->
            case message of
            _   | any ($ username) [T.null, T.any isPunctuation, T.any isSpace] ->
                    sendError "Name cannot contain punctuation or whitespace, and cannot be empty"
                | clientExists client clients ->
                    sendError "User already exists"
                | otherwise -> flip finally disconnect $ do
                    modifyMVar_ state $ \s -> do
                        let userList = T.intercalate ";" (map fst s)
                        sendMessage Message { kind = "login", sender = "server", value = userList } client
                        let s' = addClient client s
                        broadcast Message { kind = "user", sender = username, value = "connected" } s'
                        return s'
                    talk state client
                where
                    username = sender message
                    client = (username, conn)
                    disconnect = do
                        -- Remove client and return new state
                        s <- modifyMVar state $
                            \s -> let s' = removeClient client s in return (s', s')
                        broadcast Message { kind = "user", sender = username, value = "disconnected" } s

talk :: MVar ServerState -> Client -> IO ()
talk state (user, conn) = forever $ do
    receivedData <- WS.receiveData conn
    case decode receivedData :: Maybe Message of
        Just message -> readMVar state >>= broadcast message
        Nothing -> print receivedData
