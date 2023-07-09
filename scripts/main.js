"use strict";
var Method;
(function (Method) {
    Method["POST"] = "POST";
    Method["GET"] = "GET";
    Method["PUT"] = "PUT";
    Method["DELETE"] = "DELETE";
})(Method || (Method = {}));
const STORAGE_KEY = "FORMS";
class ExtendedMap extends Map {
    toJSON() {
        return [...this.entries()];
    }
}
function toValidUrl(url) {
    console.log(":>>", url);
    if (!url.toLocaleLowerCase().startsWith("http")) {
        return "https://" + url;
    }
    return url;
}
class Form {
    constructor(method, url, data) {
        this.url = url;
        this.method = method;
        this.data = data !== null && data !== void 0 ? data : new ExtendedMap();
        this.date = new Date();
    }
    validate() {
        if (!this.method || !this.url || !Method[this.method]) {
            throw Error("Invalid form");
        }
    }
}
class StorageHandler {
    constructor() {
        this.history = [];
        const val = localStorage.getItem(STORAGE_KEY);
        if (val == null) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
        }
        else {
            this.history = JSON.parse(val);
        }
    }
    addToHistory(form) {
        form.id = this.getNextId();
        this.history.push(form);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    }
    getNextId() {
        const histories = this.getAllHistories();
        return histories.length > 0 ? histories[histories.length - 1].id + 1 : 1;
    }
    getAllHistories() {
        this.history = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return this.history;
    }
    clear() {
        this.history = [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    }
}
class FromHandler {
    constructor(storage) {
        this.storage = storage;
    }
    sendHandler() {
        const form = new Form();
        const htmlForm = document.getElementById("form");
        form.method = Method[document.getElementById("method").value];
        const url = document.getElementById("url");
        url.value = toValidUrl(url.value);
        form.url = url.value;
        Array.from(htmlForm.firstElementChild.children).forEach(element => {
            const key = element.getElementsByClassName("from-data-key").item(0).value;
            const value = element.getElementsByClassName("from-data-value").item(0).value;
            form.data.set(key, value);
        });
        form.validate();
        this.storage.addToHistory(form);
        this.submitForm(form);
    }
    submitForm(form) {
        const actionForm = document.createElement("form");
        actionForm.method = Method[form.method];
        actionForm.action = form.url;
        form.data.forEach((value, key) => {
            const input = document.createElement("input");
            input.name = key;
            input.value = value;
            actionForm.appendChild(input);
        });
        actionForm.style.cssText = "display: none;";
        document.body.appendChild(actionForm);
        actionForm.submit();
    }
    loadForm(form) {
        var _a, _b;
        document.getElementById("method").value = form.method;
        document.getElementById("url").value = form.url;
        const formData = document.getElementById("form-data");
        formData.replaceChildren();
        for (let i = 0; i < Object.keys(form.data).length; i++) {
            this.addFromRow();
        }
        const rows = formData.children;
        let counter = 0;
        for (let [key, val] of form.data) {
            ((_a = rows.item(counter)) === null || _a === void 0 ? void 0 : _a.getElementsByClassName("from-data-key")[0]).value = key;
            ((_b = rows.item(counter)) === null || _b === void 0 ? void 0 : _b.getElementsByClassName("from-data-value")[0]).value = val;
            counter++;
        }
    }
    addFromRow() {
        const header = this.buildNewRow();
        document.getElementById("form-data")
            .insertAdjacentElement('beforeend', header);
    }
    buildNewRow() {
        let header = document.createElement("li");
        header.innerHTML = `<input class="from-data-key" type="text" placeholder="Name"> 
                            <input class="from-data-value" type="text" placeholder="Value"> 
                            <button class="removeRowBtn smallBtn">X</button>`;
        this.setRemoveListner(header.lastElementChild);
        return header;
    }
    removeFormRow(elem) {
        var _a, _b;
        (_b = (_a = elem.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.removeChild(elem.parentElement);
    }
    addEventListnerForAddFormRow() {
        var _a;
        let that = this;
        (_a = document.getElementById("addFormRowBtn")) === null || _a === void 0 ? void 0 : _a.addEventListener("mouseup", () => that.addFromRow());
    }
    addEventListnerForRemoveFormRow() {
        const elems = document.getElementsByClassName("removeRowBtn");
        Array.from(elems)
            .forEach(element => this.setRemoveListner(element));
    }
    setRemoveListner(element) {
        let that = this;
        element.addEventListener("mouseup", function () { that.removeFormRow(this); });
    }
    addEventListnerForSend() {
        var _a;
        const that = this;
        (_a = document.getElementById("send")) === null || _a === void 0 ? void 0 : _a.addEventListener("mouseup", () => that.sendHandler());
    }
    setupHandlers() {
        this.addEventListnerForAddFormRow();
        this.addEventListnerForRemoveFormRow();
        this.addEventListnerForSend();
    }
}
class HistoryHandler {
    constructor(storage, form) {
        this.storage = storage;
        this.form = form;
    }
    loadHistory() {
        var _a;
        const historyElement = document.getElementById("history");
        (_a = historyElement === null || historyElement === void 0 ? void 0 : historyElement.firstChild) === null || _a === void 0 ? void 0 : _a.remove();
        this.storage.getAllHistories().forEach(form => {
            const elem = this.formToHtml(form);
            historyElement === null || historyElement === void 0 ? void 0 : historyElement.insertAdjacentElement("afterbegin", elem);
        });
    }
    formToHtml(form) {
        var _a;
        const elem = document.createElement("li");
        elem.id = String(form.id);
        const len = 20;
        const date = new Date(form.date).toLocaleString();
        const url = form.url.length < len ? form.url : ((_a = form.url) === null || _a === void 0 ? void 0 : _a.substring(0, len - 3)) + "...";
        const newHtml = `<label>${form.method}</label> <span>${url} | ${date}</span>`;
        const lable = document.createElement("label");
        const request = document.createElement("span");
        lable.textContent = form.method.toString();
        request.textContent = url + " | " + date;
        elem.insertAdjacentElement("afterbegin", lable);
        elem.insertAdjacentHTML("beforeend", " ");
        elem.insertAdjacentElement("beforeend", request);
        this.addUseEventLisnter(elem);
        return elem;
    }
    addUseEventLisnter(elem) {
        const that = this;
        elem.addEventListener("click", function () {
            const id = that.exractId(this);
            const form = that.storage.getAllHistories().filter(form => form.id == id)[0];
            that.form.loadForm(form);
        });
    }
    exractId(elem) {
        return parseInt(elem.id);
    }
    clearHistory() {
        this.storage.clear();
    }
    addLoadEventListner() {
        window.addEventListener("storage", (event) => {
            this.loadHistory();
        });
    }
    addClearEventListner() {
        var _a;
        const that = this;
        (_a = document.getElementById("clear-history")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
            that.clearHistory();
            location.reload();
        });
    }
    setupHandlers() {
        this.addLoadEventListner();
        this.addClearEventListner();
        this.loadHistory();
    }
}
function setup() {
    const storage = new StorageHandler();
    const form = new FromHandler(storage);
    const history = new HistoryHandler(storage, form);
    form.setupHandlers();
    history.setupHandlers();
}
setup();
