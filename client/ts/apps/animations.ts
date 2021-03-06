/*
* todo: obviously big opportunity for abstraction and currying here
*/
function entryTransitionOver() {
    // avoid glitch where styles are removed an instant before node removal
    this.removeEventListener("transitionend", entryTransitionOver);
    this.removeAttribute("style");
}
function growHeight({dom:node}) {
    const {height} = node.getBoundingClientRect();
    node.addEventListener("transitionend", entryTransitionOver);
    node.style.height = "0px";
    node.style.overflow = "hidden";
    node.style.transition = "height 500ms";
    setTimeout(()=>node.style.height=`${height}px`, 100);
}
function shrinkHeight({dom:node}) {
    const {height} = node.getBoundingClientRect();
    node.style.height = `${height}px`;
    node.style.overflow = "hidden";
    node.style.transition = "height 500ms";
    setTimeout(()=>node.style.height="0px", 100);
    const cleanUp = (resolve) => node.addEventListener("transitionend", resolve);
    // return promise from handler to delay deletion of node
    return new Promise(cleanUp)
}
function growWidth({dom:node}) {
    const {width} = node.getBoundingClientRect();
    node.addEventListener("transitionend", entryTransitionOver);
    node.style.width = "0px";
    node.style.overflow = "hidden";
    node.style.transition = "width 500ms";
    setTimeout(()=>node.style.width=`${width}px`, 100);
}
function shrinkWidth({dom:node}) {
    const {width} = node.getBoundingClientRect();
    node.style.width = `${width}px`;
    node.style.overflow = "hidden";
    node.style.transition = "width 500ms";
    setTimeout(()=>node.style.width="0px", 100);
    const cleanUp = (resolve) => node.addEventListener("transitionend", resolve);
    // return promise from handler to delay deletion of node
    return new Promise(cleanUp)
}
function fadeOut({dom:node}) {
    node.style.transition = "opacity 500ms";
    node.style.opacity = "0";
    const cleanUp = (resolve) => node.addEventListener("transitionend", resolve);
    // return promise from handler to delay deletion of node
    return new Promise(cleanUp)
}
