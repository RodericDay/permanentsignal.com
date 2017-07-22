function sorted(set) {
    /* Combination of TypeScript, Sets, and ES5 needs a workaround */
    var sortable = [];
    set.forEach(item=>sortable.push(item));
    return sortable.sort()
}
function clear() {
    var msg = `You sure you want to delete ${state.messages.length} messages?`
    if(confirm(msg)) {
        state.messages = [];
        localStorage.messages = JSON.stringify(state.messages);
    }
}
function post(e) {
    e.preventDefault();
    if(e.target.post.value) {
        sendMessage("post", e.target.post.value);
        e.target.post.value = "";
    }
}
function refresh() {
    location.replace(location.href);
}
function uploadFile(event) {
    for(let file of event.target.files) {
        let reader = new FileReader();
        // humanize filesize
        // breaks w/ 0
        let size = ['B','KB','MB','GB'].map((u,i)=>[+(file.size/Math.pow(10,3*i)).toFixed(1),u]).filter(([n,u])=>n>1).pop().join('');
        reader.onload = (e) => {
            sendMessage("post", `<a download="${file.name}" href="${reader.result}">${file.name} (${size})</a>`)
        }
        reader.readAsDataURL(file);
    }
}
function scrollToNewest() {
    var _ = function() {
        var el = document.getElementById("chat-log");
        if(el) { el.scrollTop = el.scrollHeight; }
    }
    window.setTimeout(_, 0);
}
function upload() {
    (document.getElementById("fileInput") as HTMLInputElement).click();
}
/* views */
var Chat = {
    view: () => !state.loggedIn?[]:[
        m("div#chat-log", state.messages.map(s=>m.trust(marked(s).replace(/a href/g, `a target="_blank" href`)))),
        m("form", {onsubmit: post}, m("input[name=post]", {autocomplete: "off"})),
        m("div#user-list", sorted(state.users).map(u=>m("div", u))),
        m("input#fileInput[type=file][multiple][hidden]", {onchange: uploadFile}),
    ]
}
/* listeners */
addEventListener("login", (e:CustomEvent)=>{
    state.users = new Set([...e.detail.value.split(';')]);
    m.redraw();
    scrollToNewest();
});
addEventListener("connect", (e:CustomEvent)=>{
    state.users.add(e.detail.value);
    m.redraw();
});
addEventListener("disconnect", (e:CustomEvent)=>{
    state.users.delete(e.detail.value);
    m.redraw();
});
addEventListener("post", (e:CustomEvent)=>{
    state.messages.push(`${e.detail.sender}: ${e.detail.value}`);
    localStorage.messages = JSON.stringify(state.messages);
    m.redraw();
    scrollToNewest();
});
/* initialize */
state.actions.push(clear);
state.actions.push(upload); // img[src=svg/upload.svg]
var chatRoot = document.createElement("div");
chatRoot.id = "chat";
document.body.appendChild(chatRoot);
m.mount(chatRoot, Chat);
