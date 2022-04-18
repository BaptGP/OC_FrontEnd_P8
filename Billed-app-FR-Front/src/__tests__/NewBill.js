import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);
window.alert = jest.fn();

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    describe("Given all fields are filled correctly and I click on submit button", () => {
      test("Then A new bill should be submitted and Bills page should be rendered", () => {
        jest.spyOn(mockStore, "bills");
        const html = NewBillUI();
        document.body.innerHTML = html;

        const expenseTypeInput = screen.getByTestId("expense-type");
        fireEvent.change(expenseTypeInput, { target: { value: "Transports" } });
        expect(expenseTypeInput.value).toBe("Transports");

        const expenseNameInput = screen.getByTestId("expense-name");
        fireEvent.change(expenseNameInput, {
          target: { value: "Vol Marseille" },
        });
        expect(expenseNameInput.value).toBe("Vol Marseille");

        const expenseDateInput = screen.getByTestId("expense-name");
        fireEvent.change(expenseDateInput, { target: { value: "03/01/2022" } });
        expect(expenseDateInput.value).toBe("03/01/2022");

        const amountInput = screen.getByTestId("amount");
        fireEvent.change(amountInput, { target: { value: "300" } });
        expect(amountInput.value).toBe("300");

        const vatInput = screen.getByTestId("vat");
        fireEvent.change(vatInput, { target: { value: "70" } });
        expect(vatInput.value).toBe("70");

        const pctInput = screen.getByTestId("pct");
        fireEvent.change(pctInput, { target: { value: "20" } });
        expect(pctInput.value).toBe("20");

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "jane@doe",
          })
        );

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const newBill = new NewBill({
          document,
          onNavigate,
          store: null,
          localStorage,
        });
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn(newBill.handleSubmit);
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);
        expect(handleSubmit).toHaveBeenCalled();
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
        expect(form).toBeTruthy();
      });
    });
    describe("Given I added an image file in the file input", () => {
      test("Then the file should have been changed in the file input", () => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        const html = NewBillUI();
        document.body.innerHTML = html;
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        class ApiEntityMock {
          async create({ data, headers = {} }) {
            return Promise.resolve({ fileUrl: "image.png", key: 1 });
          }
        }

        class StorageMock {
          bills() {
            return new ApiEntityMock();
          }
        }

        const newBill = new NewBill({
          document,
          onNavigate,
          store: new StorageMock(),
          localStorage: window.localStorage,
        });

        const fileInput = screen.getByTestId("file");
        const file = new File(["image.png"], "image.png", {
          type: "image/png",
        });
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
        fileInput.addEventListener("change", handleChangeFile);
        userEvent.upload(fileInput, file);

        expect(handleChangeFile).toHaveBeenCalled();
        expect(screen.getByTestId("file").files[0].name).not.toBeNull();
      });
    });
  });
});

// POST

describe("When user is on NewBill Page and click on Submit", () => {
  test("it should create a new Bill", async () => {
    //Create a newBill Datas
    const newBill = {
      id: "22222222aaaaaaaaaa",
      status: "refused",
      pct: 20,
      amount: 200,
      email: "a@a",
      name: "test unitaire POST new Bill",
      vat: "40",
      fileName: "preview-facture-free-201801-pdf-1.jpg",
      date: "2005-02-02",
      commentAdmin: "Ceci est un test d'intégration",
      commentary: "test POST",
      type: "Restaurants et bars",
      fileUrl:
        "https://binaries.templates.cdn.office.net/support/templates/fr-fr/lt02780257_quantized.png",
    };

    //SpyOn the So Called store Mock - post
    const postSpy = jest.spyOn(mockStore, "bills");

    //Values return after store called
    const bills = await mockStore.bills().create(newBill);

    expect(postSpy).toHaveBeenCalledTimes(1);

    expect(newBill.id).toEqual("22222222aaaaaaaaaa");
  });

  test("fetches bills from mock API post ", async () => {
    const newBill = {
      id: "22222222aaaaaaaaaa",
      status: "refused",
      pct: 20,
      amount: 200,
      email: "a@a",
      name: "test unitaire POST new Bill",
      vat: "40",
      fileName: "preview-facture-free-201801-pdf-1.jpg",
      date: "2005-02-02",
      commentAdmin: "Ceci est un test d'intégration",
      commentary: "test POST",
      type: "Restaurants et bars",
      fileUrl:
        "https://binaries.templates.cdn.office.net/support/templates/fr-fr/lt02780257_quantized.png",
    };
    // Spy On store Mock
    const getSpy = jest.spyOn(mockStore, "bills");
    // Values return apres que le store Mock soit appelé
    const bills = await mockStore.bills().create(newBill);
    expect(getSpy).toHaveBeenCalledTimes(2);
    expect(bills).toBeTruthy();
  });

  test("fetches bills from an API and fails with 404 message error", async () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 404"));
        },
      };
    });
    window.onNavigate(ROUTES_PATH.Bills);
    await new Promise(process.nextTick);
    const message = await screen.getByText(/Erreur 404/);
    expect(message).toBeTruthy();
  });

  test("fetches messages from an API and fails with 500 message error", async () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 500"));
        },
      };
    });
    window.onNavigate(ROUTES_PATH.Bills);
    await new Promise(process.nextTick);
    const message = await screen.getByText(/Erreur 500/);
    expect(message).toBeTruthy();
  });
});
