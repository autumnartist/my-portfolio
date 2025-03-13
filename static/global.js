console.log("IT’S ALIVE!");

function $$ (selector, context = document) {
	return Array.from(context.querySelectorAll(selector));
}

//DARK MODE
let select = document.querySelector("select");
if (localStorage.colorScheme) {
    document.documentElement.style.setProperty("color-scheme", localStorage.colorScheme);
    select.value = localStorage.colorScheme;
}
select.addEventListener("input", function (event) {
	console.log("color scheme changed to", event.target.value);
    document.documentElement.style.setProperty("color-scheme", event.target.value);

    localStorage.colorScheme = event.target.value;
});

// contact page
let form = document.querySelector(".contactFields");

form?.addEventListener("submit", function (event) {
	event.preventDefault();
    let data = new FormData(form);

    let url = form.action + "?";
    for (let [name, value] of data) {
        url += (name + "=" + value + "&")
        console.log(name, value);
    }
    location.href = url;
})

