enum Method {
    POST = "POST",
    GET = "GET",
    PUT = "PUT",
    DELETE = "DELETE"
}
const STORAGE_KEY = "FORMS"

class ExtendedMap<K, V> extends Map<K, V> {
    toJSON() {
        return [...this.entries()]
    }
}

function toValidUrl(url: string):string {
    console.log(":>>",url)
    if (!url.toLocaleLowerCase().startsWith("http")) {
        return "https://" + url
    }
    return url
}

class Form {
    id?: number
    method?: Method;
    url?: string;
    data: ExtendedMap<string, string>;
    date: Date

    constructor();
    constructor(method?: Method, url?: string, data?: ExtendedMap<string, string>) {
        this.url = url
        this.method = method
        this.data = data ?? new ExtendedMap<string, string>()
        this.date = new Date()
    }
    validate() {
        if (!this.method || !this.url || !Method[this.method]) {
            throw Error("Invalid form")
        }
    }
}


class StorageHandler {
    private history: Form[] = [];
    constructor() {
        const val = localStorage.getItem(STORAGE_KEY)
        if (val == null) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history))
        } else {
            this.history = JSON.parse(val)
        }
    }
    addToHistory(form: Form) {
        form.id = this.getNextId()
        this.history.push(form)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history))
    }
    private getNextId() {
        const histories = this.getAllHistories()
        return histories.length > 0 ? histories[histories.length - 1].id! + 1 : 1
    }
    getAllHistories() {
        this.history = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
        return this.history
    }
    clear() {
        this.history = []
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history))
    }
}
class FromHandler {
    private storage: StorageHandler

    constructor(storage: StorageHandler) {
        this.storage = storage
    }

    private sendHandler() {
        const form = new Form()
        const htmlForm = document.getElementById("form") as HTMLFormElement
        form.method = Method[(document.getElementById("method") as HTMLInputElement).value as keyof typeof Method]
        const url =(document.getElementById("url") as HTMLInputElement)
        url.value = toValidUrl(url.value)
        form.url = url.value
        Array.from(htmlForm.firstElementChild!.children!).forEach(element => {
            const key = (element.getElementsByClassName("from-data-key").item(0)! as HTMLInputElement).value
            const value = (element.getElementsByClassName("from-data-value").item(0)! as HTMLInputElement).value
            form.data.set(key, value)
        })
        form.validate()
        this.storage.addToHistory(form)
        this.submitForm(form)
    }

    private submitForm(form: Form): void {
        const actionForm = document.createElement("form") as HTMLFormElement
        actionForm.method = Method[form.method!]
        actionForm.action = form.url!
        form.data.forEach((value, key) => {
            const input = document.createElement("input")
            input.name = key
            input.value = value
            actionForm.appendChild(input)
        })
        actionForm.style.cssText = "display: none;"
        document.body.appendChild(actionForm)
        actionForm.submit()
    }

    loadForm(form: Form) {
        (document.getElementById("method")! as HTMLInputElement).value = form.method!;
        (document.getElementById("url")! as HTMLInputElement).value = form.url!;
        const formData = (document.getElementById("form-data")! as HTMLInputElement)
        formData.replaceChildren()
        for (let i = 0; i < Object.keys(form.data).length; i++) {
            this.addFromRow()
        }
        const rows = formData.children
        let counter = 0
        for (let [key, val] of form.data) {
            (rows.item(counter)?.getElementsByClassName("from-data-key")[0] as HTMLInputElement).value = key;
            (rows.item(counter)?.getElementsByClassName("from-data-value")[0] as HTMLInputElement).value = val;
            counter++
        }
    }

    private addFromRow(): void {
        const header = this.buildNewRow()
        document.getElementById("form-data")!
            .insertAdjacentElement('beforeend', header)
    }

    private buildNewRow(): HTMLElement {
        let header = document.createElement("li")
        header.innerHTML = `<input class="from-data-key" type="text" placeholder="Name"> 
                            <input class="from-data-value" type="text" placeholder="Value"> 
                            <button class="removeRowBtn smallBtn">X</button>`
        this.setRemoveListner(header.lastElementChild! as HTMLElement)
        return header
    }

    private removeFormRow(elem: HTMLElement): void {
        elem.parentElement?.parentElement?.removeChild(elem.parentElement)
    }

    private addEventListnerForAddFormRow(): void {
        let that = this
        document.getElementById("addFormRowBtn")
            ?.addEventListener("mouseup", () => that.addFromRow())

    }
    private addEventListnerForRemoveFormRow(): void {
        const elems = document.getElementsByClassName("removeRowBtn")
        Array.from(elems)
            .forEach(element => this.setRemoveListner(element as HTMLElement));
    }
    private setRemoveListner(element: HTMLElement): void {
        let that = this
        element.addEventListener("mouseup", function (this) { that.removeFormRow(this) })
    }

    private addEventListnerForSend() {
        const that = this
        document.getElementById("send")?.addEventListener("mouseup", () => that.sendHandler())
    }
    setupHandlers() {
        this.addEventListnerForAddFormRow()
        this.addEventListnerForRemoveFormRow()
        this.addEventListnerForSend()
    }
}

class HistoryHandler {
    private storage: StorageHandler
    private form: FromHandler

    constructor(storage: StorageHandler, form: FromHandler) {
        this.storage = storage
        this.form = form
    }
    loadHistory() {
        const historyElement = document.getElementById("history")
        historyElement?.firstChild?.remove()
        this.storage.getAllHistories().forEach(form => {
            const elem = this.formToHtml(form);
            historyElement?.insertAdjacentElement("afterbegin", elem)
        })
    }

    private formToHtml(form: Form) {
        const elem = document.createElement("li");
        elem.id = String(form.id!);
        const len = 20;
        const date = new Date(form.date).toLocaleString();
        const url = form.url!.length < len ? form.url : form.url?.substring(0, len - 3) + "...";
        const newHtml = `<label>${form.method}</label> <span>${url} | ${date}</span>`;
        const lable = document.createElement("label")
        const request = document.createElement("span")
        lable.textContent = form.method!.toString()
        request.textContent = url + " | " + date
        elem.insertAdjacentElement("afterbegin", lable) 
        elem.insertAdjacentHTML("beforeend", " ")
        elem.insertAdjacentElement("beforeend", request)
        this.addUseEventLisnter(elem); 
        return elem;
    }

    private addUseEventLisnter(elem: HTMLElement) {
        const that = this
        elem.addEventListener("click", function (this) {
            const id = that.exractId(this)
            const form = that.storage.getAllHistories().filter(form => form.id == id)[0]
            that.form.loadForm(form)
        })
    }

    private exractId(elem: HTMLElement): number {
        return parseInt(elem.id)
    }

    private clearHistory() {
        this.storage.clear()
    }

    private addLoadEventListner() {
        window.addEventListener("storage", (event) => {
            this.loadHistory()
        })
    }

    private addClearEventListner() {
        const that = this
        document.getElementById("clear-history")
            ?.addEventListener("click", () => {
                that.clearHistory()
                location.reload()
            })
    }

    setupHandlers() {
        this.addLoadEventListner()
        this.addClearEventListner()
        this.loadHistory()
    }
}

function setup() {
    const storage = new StorageHandler()
    const form = new FromHandler(storage)
    const history = new HistoryHandler(storage, form)
    form.setupHandlers()
    history.setupHandlers()
}
setup()