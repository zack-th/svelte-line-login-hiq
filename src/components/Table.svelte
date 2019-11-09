<script>
  import Search from "./Search.svelte";
  import { storeUserHIQ, activeProgress } from "../utils/store.js";
  export let userFileter = [];

  $: showRegisForm = !(userFileter.length > 0);
  let dataRegister = [];
  function registerUser(data) {
    showRegisForm = true;
    dataRegister = data;
  }
</script>

<style>
  /* .section-table {
    margin-top: 30px;
  } */

  table td {
    border-top: 1px solid #cccccc;
  }

  .mbr-iconfont:hover {
    color: red;
    cursor: pointer;
    position: absolute;
    content: "\e929";
    margin: -6px;
  }

  .mbr-iconfont {
    font-size: 2rem !important;
    cursor: pointer;
    position: absolute;
    content: "\e929";
    margin: -6px;
  }

  .register-form {
    padding-top: 60px;
    padding-bottom: 60px;
    background-color: #c9c9c9;
    text-align: left;
  }

  input[type="text"] {
    text-align: center;
  }

  .dataTables_filter {
    margin-bottom: 10px;
  }

  .btn-primary, .btn-primary:active {
    background-color: #054d20 !important;
    border-color: #054d20 !important;
    color: #ffffff !important;
  }

  .btn-primary:hover {
    background-color: #db2332 !important;
    border-color: #db2332 !important;
    color: #ffffff !important;
  }
</style>

<section class="section-table cid-rHfxX4jQGN" id="table1-4">
  <div class="container container-table">
    <Search />
    <div class="container scroll">
      {#if userFileter.length > 0 && showRegisForm === false}
        <p class="searchInfo mbr-fonts-style display-7">ผลลัพธ์การค้นหา</p>
        <table class="table isSearch" cellspacing="0">
          <thead>
            <tr class="table-heads ">
              <th class="head-item mbr-fonts-style display-5">รหัส</th>
              <th class="head-item mbr-fonts-style display-5">ชื่อ-สกุล</th>
              <th class="head-item mbr-fonts-style display-5">วันเกิด</th>
              <th class="head-item mbr-fonts-style display-5">ลงทะเบียน</th>
            </tr>
          </thead>
          <tbody>
            {#each userFileter as user, i}
              <tr
                style={i % 2 === 0 ? 'background:#c2e8ee;' : 'background:#f8ecc7;'}>
                <td class="body-item mbr-fonts-style display-7">
                  {user.data.id}
                </td>
                <td class="body-item mbr-fonts-style display-7">
                  {`${user.data.title} ${user.data.fname} ${user.data.lname}`}
                </td>
                <td class="body-item mbr-fonts-style display-7">
                  {`${user.data.birth}`}
                </td>
                <td class="body-item mbr-fonts-style display-7">
                  <span
                    on:click={() => registerUser(user.data)}
                    class="btn-icon mbri-edit mbr-iconfont mbr-iconfont-btn" />
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}

    </div>

  </div>
</section>

{#if showRegisForm && userFileter.length > 0}
  <section class="section-table register-form" id="table1-4">
    <h2
      style="color:#f30000 !important;"
      class="mbr-section-title mbr-fonts-style align-center pb-3 display-2">
      ข้อมูลของคุณ
    </h2>
    <div class="container">
      <div class="row search">
        <div class="col-md-6">
          <div class="dataTables_filter">
            <label class="searchInfo mbr-fonts-style display-5">รหัส :</label>
            <input
              type="text"
              id="id"
              class="form-control input-sm"
              value={dataRegister.id}
              disabled={true}
              placeholder="ใส่ ชื่อ/สกุล เพื่อค้นหา" />
          </div>
          <hr />
          <div class="dataTables_filter">
            <label class="searchInfo mbr-fonts-style display-5">ชื่อ :</label>
            <input
              type="text"
              id="fname"
              class="form-control input-sm"
              value={dataRegister.fname}
              placeholder="ใส่ ชื่อ/สกุล เพื่อค้นหา" />
          </div>
          <hr />
        </div>
        <div class="col-md-6">
          <div class="dataTables_filter">
            <label class="searchInfo mbr-fonts-style display-5">สกุล :</label>
            <input
              type="text"
              id="lname"
              class="form-control input-sm js-date-picker"
              value={dataRegister.lname} />
          </div>
          <hr />
          <div class="dataTables_filter">
            <label class="searchInfo mbr-fonts-style display-5">
              วันเกิด :
            </label>
            <input
              type="text"
              id="birth"
              class="form-control input-sm"
              value={dataRegister.birth}
              placeholder="ใส่ ชื่อ/สกุล เพื่อค้นหา" />
          </div>
          <hr />
          <div style="margin-top:20px;" class="navbar-buttons mbr-section-btn">
            <a style="cursor:pointer;" class="btn btn-xl btn-primary">
              <span class="btn-icon mbri-save mbr-iconfont-btn display-7">&nbsp; บึนทึกข้อมูล</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
{/if}
