export default function isLocal(url) {
	var a = document.createElement('a');
	a.href = url;
	var u = new URL(a.href);
	return u.origin === window.location.origin;
}
