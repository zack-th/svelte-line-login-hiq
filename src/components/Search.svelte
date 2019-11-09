<script>
  import Picker from "../utils/picker.js";
  import { onMount } from "svelte";
  import { storeUserHIQ, activeProgress, passAdmin } from "../utils/store.js";

  let statusAdm = false;
  const production = !!process.env.NODE_ENV;
  let delayInput;
  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฏาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พศจิกายน",
    "ธันวาคม"
  ];
  const monthsShort = [
    "ม.ค",
    "ก.พ",
    "ม.ค",
    "เม.ย",
    "พ.ค",
    "มิ.ย",
    "ก.ค",
    "ส.ค",
    "ก.ย",
    "ต.ค",
    "พ.ย",
    "ธ.ค"
  ];

  onMount(() => {
    var input = document.getElementById("js-date-picker");
    var picker = new Picker(input, {
      headers: true,
      format: "MMMM/D/YYYY",
      text: {
        title: "ระบุวันเกิดคุณ",
        cancel: "ยกเลิก",
        confirm: "ยืนยัน",
        month: "เดือน",
        year: "ปี",
        day: "วัน"
      }
    });
    if (window.localStorage.getItem("isdev") === "true") {
      getFirebaseDb("users");
    }

    passAdmin.subscribe(resp => {
      // alert(resp)
      if (resp === "p@ssw0rd") {
        statusAdm = true;
      } else {
        statusAdm = false;
      }
    });
  });

  function onInputDateChanged(event) {
    const dateVal = event.target.value;
    let date = dateVal.split("/")[1];
    let month = paseMonth(dateVal.split("/")[0]) + 1;
    const year = dateVal.split("/")[2];
    if (month < 10) {
      month = "0" + month;
    }
    if (date < 10) {
      date = "0" + date;
    }
    getFirebaseDb("birth", `${date}/${month}/${year}`);
  }

  function onInputNameChang(event) {
    if (delayInput) {
      clearInterval(delayInput);
    }
    delayInput = setTimeout(() => {
      const nameVal = event.target.value;
      if (nameVal === "") {
        storeUserHIQ.set([]);
        return;
      }
      getFirebaseDb("name", `${nameVal}`);
    }, 800);
  }

  let userHIQ = [];
  function getFirebaseDb(type, value) {
    userHIQ = [];
    if (type === "birth") {
      fetchFunc(
        production
          ? `/getusers?birth=${value}`
          : `http://localhost:3000/getusers?birth=${value}`,
        "birth"
      );
    } else if (type === "name") {
      fetchFunc(
        production
          ? `/getusers?name=${value}`
          : `http://localhost:3000/getusers?name=${value}`,
        "name"
      );
    }
  }

  function fetchFunc(url, type) {
    activeProgress.set(true);
    fetch(url)
      .then(async resp => {
        console.log("then");
        activeProgress.set(false);
        userHIQ = await resp.json();
        const dtUser =
          type === "birth" && userHIQ.data.id
            ? [{ key: userHIQ.keys, data: userHIQ.data }]
            : userHIQ;
        storeUserHIQ.set(dtUser);
      })
      .catch(err => {
        console.log("catch");
        storeUserHIQ.set([]);
        activeProgress.set(false);
        userHIQ = [];
      });
  }

  function paseMonth(month) {
    return months.findIndex(dt => dt === month) !== -1
      ? months.findIndex(dt => dt === month)
      : monthsShort.findIndex(dt => dt === month);
  }
</script>

<style>
  input[type="text"] {
    text-align: center;
  }
</style>

<div id="register" class="table-wrapper">
  <h2 class="mbr-section-title mbr-fonts-style align-center pb-3 display-2">
    ค้นหารหัสพนักงาน
  </h2>
  <hr />
  <div class="container">
    <div class="row search">
      <div class="col-md-6" />
      <div class="col-md-6">
        {#if statusAdm === true}
          <div id="dataTables_filter" class="dataTables_filter">
            <label class="searchInfo mbr-fonts-style display-7">
              ค้นหาจากชื่อ-สกุล:
            </label>
            <input
              on:input={event => onInputNameChang(event)}
              type="text"
              id="name"
              class="form-control input-sm"
              value=""
              placeholder="ใส่ ชื่อ/สกุล เพื่อค้นหา" />
          </div>
        {/if}
        <div id="dataTables_filter" class="dataTables_filter">
          <label class="searchInfo mbr-fonts-style display-7">
            ค้นหาจากวันเกิด:
          </label>
          <input
            on:change={event => onInputDateChanged(event)}
            type="text"
            id="js-date-picker"
            class="form-control input-sm js-date-picker"
            value="กรกฏาคม/18/2538" />
        </div>
      </div>
    </div>
    <hr />
  </div>

</div>
