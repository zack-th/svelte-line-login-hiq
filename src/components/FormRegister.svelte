<script>
  import { modalService } from "src/utils/store.js";
  import { storeUserHIQ, activeProgress } from "src/utils/store.js";
  import Picker from "src/utils/picker.js";
  import { onMount } from "svelte";

  const defaultDate = "กรกฏาคม/18/2530";
  let formInput;
  let _fname = "";
  let _lname = "";
  let _birth = defaultDate;

  function validForm() {
    if (!inputIsEmpty()) {
      if (_birth === defaultDate) {
        modalService.set({
          status: "open",
          focusName: "birth",
          title: "แจ้งเตือน !!",
          detail: `กรุณากรอกข้อมูล <b style="color:red;"> [ วันเกิดของคุณให้ถูกต้อง ] </b> ก่อนยืนยัน`
        });
      } else {
        getFirebaseDb("full", { fname: _fname, lname: _lname, birth: _birth });
      }
      
    }
  }

  function inputIsEmpty() {
    let isnull = false;

    Object.keys(formInput).filter(key => {
      if (
        !isnull &&
        !formInput[key].value &&
        (formInput[key].type === "text" || formInput[key].type === "password")
      ) {
        // alert(formInput[key]['name']);
        isnull = !isnull;
        modalService.set({
          status: "open",
          focusName: formInput[key].name,
          title: "แจ้งเตือน",
          detail: `กรุณากรอกข้อมูล <b style="color:red;"> [ ${formInput[key]["placeholder"]} ] </b> ก่อนยืนยัน`
        });
      }
    });
    return isnull;
  }

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
    const input = document.getElementById("js-date-picker");
    const picker = new Picker(input, {
      headers: true,
      format: "MMMM/D/YYYY",
      text: {
        title: "ระบุวันเกิดของคุณ",
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

    _birth = `${date}/${month}/${year}`;
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
    if (type === "full") {
      fetchFunc(
        production
          ? `/getusers?fname=${value.fname}&lname=${value.lname}&birth=${value.birth}`
          : `http://localhost:3000/getusers?fname=${value.fname}&lname=${value.lname}&birth=${value.birth}`,
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
        activeProgress.set(false);
        userHIQ = await resp.json();
        const dtUser =
          type === "full" && (userHIQ.data && userHIQ.data.id)
            ? [{ key: userHIQ.keys, data: userHIQ.data }]
            : userHIQ;
        storeUserHIQ.set(dtUser);
        if(userHIQ.length < 1) {
          modalService.set({
          status: "open",
          focusName: "fname",
          title: "แจ้งเตือน !!",
          detail: `ไม่พบข้อมูลของคุณ ในระบบ <br> กรุณาตรวจสอบข้อมูลอีกรอบ หรือติดต่อ เจ้าหน้าที่`
        });
        }
      })
      .catch(err => {
        console.log("catch", err);
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

</style>

<form bind:this={formInput}>
  <div class="row">
    <div class="col-md-6 form-group">
      <input
        bind:value={_fname}
        name="fname"
        type="text"
        class="form-control"
        placeholder="ชื่อ"
        required />
    </div>
    <div class="col-md-6 form-group">
      <input
        bind:value={_lname}
        name="lname"
        type="text"
        class="form-control"
        placeholder="นามสกุล"
        required />
    </div>
    <div class="col-md-6 form-group">
      <input
        on:change={event => onInputDateChanged(event)}
        id="js-date-picker"
        bind:value={_birth}
        name="birth"
        type="text"
        class="form-control js-date-picker"
        placeholder="วันเกิด"
        required />
    </div>
    <div class="col-12">
      <button
        on:click={() => validForm()}
        name="submit"
        type="button"
        class="button-style">
        ลงทะเบียน
      </button>
    </div>
  </div>

</form>
