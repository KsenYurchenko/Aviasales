class Ticket {
  constructor(price, carrier, segments, ticketId) {
    (this.price = price),
      (this.carrier = carrier),
      (this.segments = segments),
      (this.ticketId = ticketId);
  }

  setPrice() {
    let thousands = Math.trunc(+this.price / 1000);
    let rub = this.price
      .toString()
      .split("")
      .slice(-3)
      .join("");
    let ticketPrice = `${thousands} ${rub} P`;

    this.ticketId.firstElementChild.firstElementChild.innerHTML = ticketPrice;
  }

  setCarrier() {
    this.ticketId.firstElementChild.lastElementChild.style.background = `url(../images/${this.carrier}.png)`;
  }

  setRoute() {
    this.ticketId.children[1].firstElementChild.firstElementChild.innerHTML = `${this.segments[0]["origin"]} - ${this.segments[0]["destination"]}`;
    this.ticketId.children[2].firstElementChild.firstElementChild.innerHTML = `${this.segments[1]["destination"]} - ${this.segments[1]["origin"]}`;
  }

  setSchedule() {
    let arrShedules = [];

    for (let item of this.segments) {
      let date = new Date(Date.parse(item["date"]));

      let h;
      if (date.getHours() < 10) {
        h = `0${date.getHours()}`;
      } else {
        h = date.getHours();
      }

      let m;
      if (date.getMinutes() < 10) {
        m = `0${date.getMinutes()}`;
      } else {
        m = date.getMinutes();
      }

      let timeArrival = `${h}:${m}`;

      let durationMs = +item.duration;

      let date2 = new Date(Date.parse(item["date"]) + durationMs * 60000);

      let h2;
      if (date2.getHours() < 10) {
        h2 = `0${date2.getHours()}`;
      } else {
        h2 = date2.getHours();
      }

      let m2;
      if (date2.getMinutes() < 10) {
        m2 = `0${date2.getMinutes()}`;
      } else {
        m2 = date2.getMinutes();
      }

      let timeDeparture = `${h2}:${m2}`;

      let arrivalDeparture = `${timeArrival} - ${timeDeparture}`;

      arrShedules.push(arrivalDeparture);
    }

    this.ticketId.children[1].firstElementChild.lastElementChild.innerHTML =
      arrShedules[0];
    this.ticketId.children[2].firstElementChild.lastElementChild.innerHTML =
      arrShedules[1];
  }

  setStops() {
    let stops = [];
    let stopsTitle;
    let allStopsTitle = [];
    for (let item of this.segments) {
      if (item["stops"].length == 0) {
        stopsTitle = "БЕЗ ПЕРЕСАДОК";
      } else if (item["stops"].length == 1) {
        stopsTitle = "1 ПЕРЕСАДКA";
      } else {
        stopsTitle = `${item["stops"].length} ПЕРЕСАДКИ`;
      }
      allStopsTitle.push(stopsTitle);
      stops.push(item["stops"]);
    }

    this.ticketId.children[1].children[2].firstElementChild.innerHTML =
      allStopsTitle[0];
    this.ticketId.children[2].children[2].firstElementChild.innerHTML =
      allStopsTitle[1];

    this.ticketId.children[1].children[2].lastElementChild.innerHTML = stops[0];
    this.ticketId.children[2].children[2].lastElementChild.innerHTML = stops[1];
  }

  setDuration() {
    let arrDurations = [];

    for (let item of this.segments) {
      let min = item["duration"] % 60;
      if (min < 10) {
        min = `0${min}m`;
      } else {
        min = `${min}m`;
      }
      let hours = Math.trunc(item["duration"] / 60) + "h";
      let travelWay = `${hours} ${min}`;
      arrDurations.push(travelWay);
    }
    this.ticketId.children[1].children[1].lastElementChild.innerHTML =
      arrDurations[0];
    this.ticketId.children[2].children[1].lastElementChild.innerHTML =
      arrDurations[1];
  }
}

async function getSearchId() {
  let response = await fetch("https://front-test.beta.aviasales.ru/search");
  if (response.ok === true && response.status < 300) {
    let searchId = await response
      .text()
      .then(value => JSON.parse(value)["searchId"]);
    return searchId;
  } else {
    alert(`Ошибка HTTP: ${response.status}
    Пожалуйста, повторите попытку позже`);
  }
}

function comparePrice(a, b) {
  return a.price - b.price;
}

function compareSpeed(a, b) {
  return (
    a.segments[0].duration +
    a.segments[1].duration -
    (b.segments[0].duration + b.segments[1].duration)
  );
}

let selectPriceOrSpeed = "price";

let amountStops = 3;

function stopsSelection(allTickets) {
  let selectedArray = [];
  if (amountStops == 3) {
    selectedArray.push(...allTickets);
  } else {
    for (let i = 0; i < allTickets.length; i++) {
      if (
        allTickets[i].segments[0].stops.length <= amountStops &&
        allTickets[i].segments[1].stops.length <= amountStops
      ) {
        selectedArray.push(allTickets[i]);
      }
    }
  }
  return selectedArray;
}

function getParamsSearch() {
  for (let elem of document.querySelectorAll(".select-stops")) {
    if (elem.checked) {
      amountStops = elem.value;
    }
  }

  for (let elem of document.querySelectorAll(".select-price-or-speed")) {
    if (elem.checked) {
      selectPriceOrSpeed = elem.value;
    }
  }
}

document.querySelector(".search").onclick = async function() {
  getParamsSearch();

  let searchId = await getSearchId();
  let response = await fetch(
    `https://front-test.beta.aviasales.ru/tickets?searchId=${searchId}`
  );
  if (response.ok === true && response.status < 300) {
    let allTickets = await response
      .text()
      .then(value => JSON.parse(value)["tickets"]);

    let selectedStopArray = stopsSelection(allTickets);

    if (selectPriceOrSpeed == "price") {
      selectedStopArray.sort(comparePrice);
    } else {
      selectedStopArray.sort(compareSpeed);
    }

    let fiveTickets = selectedStopArray.slice(0, 5);

    async function setContentToHtml() {
      for (let i = 0; i < 5; i++) {
        let ticket = document.querySelector(`#ticket_${i}`);
        let thisTicket = new Ticket(
          fiveTickets[i]["price"],
          fiveTickets[i]["carrier"],
          fiveTickets[i]["segments"],
          ticket
        );

        thisTicket.setPrice();
        thisTicket.setCarrier();
        thisTicket.setRoute();
        thisTicket.setSchedule();
        thisTicket.setDuration();
        thisTicket.setStops();
      }
    }

    setContentToHtml();

    document.querySelector(".layer").style.display = "none";
    document.querySelector(".tickets").style.display = "flex";

    async function getNewSortAfterSearch() {
      getParamsSearch();

      async function changeSortTickets() {
        selectedStopArray = stopsSelection(allTickets);

        if (selectPriceOrSpeed == "price") {
          selectedStopArray.sort(comparePrice);
        } else {
          selectedStopArray.sort(compareSpeed);
        }

        fiveTickets = selectedStopArray.slice(0, 5);
      }
      await changeSortTickets();

      await setContentToHtml();
    }

    for (let elem of document.querySelectorAll(".select-price-or-speed")) {
      elem.onclick = getNewSortAfterSearch;
    }

    for (let elem of document.querySelectorAll(".select-stops")) {
      elem.onclick = getNewSortAfterSearch;
    }
  } else {
    alert(`Ошибка HTTP: ${response.status}
    Пожалуйста, повторите попытку позже`);
  }
};
