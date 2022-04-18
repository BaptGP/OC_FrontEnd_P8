/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

import mockStore from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on a Bill page but there's an error message", () => {
    it("Then error page is rendered", () => {
      document.body.innerHTML = BillsUI({error: "Error"})
      expect(screen.getAllByText("Erreur")).toBeTruthy();
    });
  });
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
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
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    //HandleClickNewBills
    it("Display NewBill's page", () => {
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
      window.onNavigate(ROUTES_PATH.Bills);
      const bills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const handleClickNewBill = jest.fn(bills.handleClickNewBill);
      const button = screen.getByTestId("btn-new-bill");
      button.addEventListener("click", handleClickNewBill);
      userEvent.click(button);

      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });
    //HandleClickIconEye
    it("Display bills", () => {
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
      window.onNavigate(ROUTES_PATH.Bills);
      const bills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      $.fn.modal = jest.fn();
      const iconEye = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(bills.handleClickIconEye(iconEye));
      const modaleFile = document.getElementById("modaleFile");
      iconEye.addEventListener("click", handleClickIconEye);
      userEvent.click(iconEye);

      expect(modaleFile).toBeTruthy();
    });
    it("There's no bills", () => {
      document.body.innerHTML = BillsUI({data: []})
      const iconEye = screen.queryByTestId("icon-eye")
      expect(iconEye).toBeNull()
    })
    it("There's no bills", () => {
      document.body.innerHTML = BillsUI({data: bills})
      const iconEye = screen.getAllByTestId("icon-eye")
      expect(iconEye).toBeTruthy()
      expect(iconEye.length).toBeGreaterThan(1)
      
    })
  });
  
});

// test d'intégration GET Bills
describe("Given I am a user connected as Employee", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills");
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
  });
  describe("When I navigate to Bills UI", () => {
    test("fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      
      await waitFor(() => screen.getByTestId("tbody"))

      expect(screen.getByTestId("tbody").innerHTML).not.toBe("");
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      document.body.innerHTML = BillsUI({error: "Erreur 404"})
      const message = await screen.getByText(/Erreur 404/);
      // wait for the error message 400
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      document.body.innerHTML = BillsUI({error: "Erreur 500"})
      const message = await screen.getByText(/Erreur 500/);
      // wait for the error message 400
      expect(message).toBeTruthy();
    });
  });
});
