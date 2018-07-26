export default function serialize() {
  return [...new FormData(document.querySelector('form')).entries()].reduce((a,b) => a += `${b[0]}=${b[1]}&`,"").slice(0,-1);
}