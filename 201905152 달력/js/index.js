const nowDate = new Date();
const nowYear = nowDate.getFullYear();
let currentMonth = nowDate.getMonth();
window.onload = defineCalendar(nowYear, currentMonth + 1);

let selectedDay;
let HoliDays;

// 로컬 스토리지에서 데이터 마운트
const userPlanString = localStorage.getItem(`userPlan`);
let userPlanObj = JSON.parse(userPlanString) || [];

// 일정 가시화
function refreshCalPlan() {
  const lastDay = new Date(nowYear, currentMonth + 1, 0).getDate(); // 해당 월의 마지막 날

  for (var index = 0; index < userPlanObj.length; index++) {
    const planStart = new Date(userPlanObj[index].planTimeStart);
    const planEnd = new Date(userPlanObj[index].planTimeEnd);

    // 지금 보고있는 월 페이지에 계획이 존재하는지?
    if (currentMonth >= planStart.getMonth() && currentMonth <= planEnd.getMonth()) {
      // 존재한다면 계획의 시작날과 끝날의 사이에 있는 달이라면?
      if (currentMonth > planStart.getMonth() && currentMonth < planEnd.getMonth()) {
        for (var dayIndex = 1; dayIndex <= lastDay; dayIndex++) {
          const targetDateCell = document.getElementById(`date-${dayIndex}-plan`);
          targetDateCell.innerHTML += `<div class="plan-item" style="box-shadow: 0 0 0 2px ${userPlanObj[index].planColor} inset"><span>${userPlanObj[index].planTitle}</span></div>`;
        }

        // 계획의 시작날이 현재 월 페이지에 존재하는가?
      } else if (currentMonth == planStart.getMonth()) {
        for (var dayIndex = 1; dayIndex <= lastDay; dayIndex++) {
          if (dayIndex >= planStart.getDate()) {
            const targetDateCell = document.getElementById(`date-${dayIndex}-plan`);
            targetDateCell.innerHTML += `<div class="plan-item" style="box-shadow: 0 0 0 2px ${userPlanObj[index].planColor} inset"><span>${userPlanObj[index].planTitle}</span></div>`;
          }
        }

        // 계획의 끝날이 현재 월 페이지에 존재하는가?
      } else if (currentMonth == planEnd.getMonth()) {
        for (var dayIndex = 1; dayIndex <= lastDay; dayIndex++) {
          if (dayIndex <= planEnd.getDate()) {
            const targetDateCell = document.getElementById(`date-${dayIndex}-plan`);
            targetDateCell.innerHTML += `<div class="plan-item" style="box-shadow: 0 0 0 2px ${userPlanObj[index].planColor} inset"><span>${userPlanObj[index].planTitle}</span></div>`;
          }
        }
      }
    }
  }
}

/**
 * 달력 클릭했을 때 객체 활성/비활성 하는 함수
 * @param {number} year 클릭한 대상의 년도
 * @param {number} month 클릭한 대상의 달
 * @param {number} date 클릭한 대상의 일자
 */
function getEvent(year, month, date) {
  const lastDay = new Date(year, month + 1, 0).getDate(); // 해당 월의 마지막 날
  const targetDateDiv = document.getElementById(`date-${date}`); // 클릭한 요소 DOM 객체 가져오기

  // 선택한 날짜가 이미 선택돼 있는지 판단
  if (!targetDateDiv.classList.contains("active")) {
    for (var i = 1; i <= lastDay; i++) {
      document.getElementById(`date-${i}`).classList.remove("active");
    }
    targetDateDiv.classList.add("active");
    selectedDay = {
      year: year,
      month: month,
      date: date,
    };
  }
}

/**
 * 한국천문연구원 특일정보 API 통신 함수
 * @param {number} year 찾고자하는 년도
 * @param {number} month 찾고자하는 달
 */
function defineCalendar(year, month) {
  const parser = new DOMParser();
  const xhr = new XMLHttpRequest();
  const url = "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";
  const holidayArray = [];
  let xmlDoc;
  let queryParams =
    "?" +
    encodeURIComponent("serviceKey") +
    "=" +
    "A172v6vRQ4lqsLTzDqEUDszd%2BiLL5YuAC1%2F%2F57FwMuYKrmF7bxn4R2q4l%2B86cZuuspKxeAGRcwByTcXXCqWNAw%3D%3D";
  queryParams += "&" + encodeURIComponent("solYear") + "=" + encodeURIComponent(`${year}`); // 조회할 년도
  queryParams += "&" + encodeURIComponent("solMonth") + "=" + encodeURIComponent(`${month}`); // 조회할 달
  console.log(url + queryParams);

  xhr.open("GET", url + queryParams);
  xhr.onreadystatechange = function () {
    if (this.readyState == 4) {
      xmlDoc = parser.parseFromString(this.response, "text/xml");
      const items = xmlDoc.querySelectorAll("item");
      for (var i = 0; i < items.length; i++) {
        const dateString = items[i].getElementsByTagName("locdate")[0].textContent;
        const dateName = items[i].getElementsByTagName("dateName")[0].textContent;
        holidayArray.push({
          dateString: dateString,
          dateName: dateName,
        });
      }
    }
    createCalendar(year, month, holidayArray);
  };
  xhr.send("");
}

/**
 * HTML 페이지에 달력을 생성하는 함수
 * @param {number} year 생성하고자 하는 년도
 * @param {number} month 생성하고자 하는 달
 * @param {Array} holidayArray defineCalendar 에서 가져온 휴일 배열
 */
function createCalendar(year, month, holidayArray) {
  const calendar = document.getElementById("cal-items"); // 달력 DOM 객체
  const firstDay = new Date(year, month - 1, 1); // 해당 월의 첫번째 날
  const lastDay = new Date(year, month, 0); // 해당 월의 마지막 날

  const firstDayOfWeek = firstDay.getDay(); // 첫번째날의 요일을 가져옴
  const lastDate = lastDay.getDate(); // 마지막째날의 날짜를 가져옴

  const totalDays = lastDate + firstDayOfWeek;
  const totalWeeks = Math.ceil(totalDays / 7); // 해당 달에 몇주가 있는지 계산

  let date = 1;

  HoliDays = holidayArray;

  calendar.innerHTML = ""; // 초기화

  for (var row = 0; row < totalWeeks; row++) {
    const tableRow = document.createElement("tr");
    for (var col = 0; col < 7; col++) {
      const tableCell = document.createElement("td");
      const dayoffString = col == 0 ? " dayoff" : "";

      if (row == 0 && col < firstDay.getDay()) {
        // 이전 달의 날짜
      } else if (date <= lastDate) {
        // 현재 달의 날짜
        tableCell.innerHTML = `<div id="date-${date}" class="cal-item${dayoffString}" onclick="getEvent(${year}, ${
          month - 1
        }, ${date})"><span class="date-num">${date}</span><div id="date-${date}-plan" class="plan-container"></div></div>`;
        date++;
      } else {
        // 다음 달의 날짜
      }
      tableRow.appendChild(tableCell);
    }
    calendar.appendChild(tableRow);
  }
  for (var i = 0; i < holidayArray.length; i++) {
    const dateNum = Number(holidayArray[i].dateString.slice(-2));
    document.getElementById(`date-${dateNum}`).classList.add("dayoff");
  }
  refreshCalPlan();
}

function prevMonth() {
  if (currentMonth < 1) {
    return;
  }
  currentMonth--;
  document.getElementById("month-title").innerHTML = `2023년 ${currentMonth + 1}월`;
  defineCalendar(nowYear, currentMonth + 1);
}

function nextMonth() {
  if (currentMonth >= 11) {
    return;
  }
  currentMonth++;
  document.getElementById("month-title").innerHTML = `2023년 ${currentMonth + 1}월`;
  defineCalendar(nowYear, currentMonth + 1);
}

function savePlan() {
  const planColor = document.getElementById("plan-color").value;
  const planTitle = document.getElementById("title-txt").value;
  const planSubject = document.getElementById("subject").value;
  const planTimeStart = document.getElementById("time-start").value;
  const planTimeEnd = document.getElementById("time-end").value;
  const planLocation = document.getElementById("location-input").value;

  if (!planTitle) {
    alert("일정 제목을 입력해주세요.");
    return;
  }
  if (!planTimeStart) {
    alert("일정 시작 시간을 입력해주세요.");
    return;
  }
  if (!planTimeEnd) {
    alert("일정 종료 시간을 입력해주세요.");
    return;
  }

  /*function clearCalendar() {
    누른 날짜 배열값 받아서 삭제

  }*/
  const saveObj = {
    planColor: planColor,
    planTitle: planTitle,
    planSubject: planSubject,
    planTimeStart: planTimeStart,
    planTimeEnd: planTimeEnd,
    planLocation: planLocation,
  };
  console.log(Date(planTimeStart));
  userPlanObj.push(saveObj);
  refreshCalPlan();

  const userPlanString = JSON.stringify(userPlanObj);
  localStorage.setItem("userPlan", userPlanString);

  alert("일정이 등록되었습니다!");
}

/*function clearCalendar(year,month,date) {
  const lastDay = new Date(year, month + 1, 0).getDate(); // 해당 월의 마지막 날
  const targetDateDiv = document.getElementById(`date-${date}`); // 클릭한 요소 DOM 객체 가져오기

  // 선택한 날짜가 이미 선택돼 있는지 판단
  if (!targetDateDiv.classList.contains("active")) {
    for (var i = 1; i <= lastDay; i++) {
      document.getElementById(`date-${i}`).classList.remove("active");
    }
    targetDateDiv.classList.add("active");
    selectedDay = {
      year: year,
      month: month,
      date: date,
    };
  }
}

  
  const clearCalendar(){

  }


 

}*/

function accountCal() {
  //수입,지출 합계계산.
  var plus = document.getElementById("plus").value;
  var minus = document.getElementById("minus").value;
  var plusacc = 0;
  var minusacc = 0;
  var totalacc = 0;

  //for-> plusacc 값을 ->i~ 31일까지 합계총액 마찬가지로 minus 똑같다.  total =
  //매일매일의 합계도.

  plusacc += plus; //한달 수입
  minusacc += minus; //한달 지출
  totalacc = plusacc - minusacc; //한달 수입,지출 합계 배열값.
}
