<script>
  import { passAdmin } from "../utils/store.js";

  function adminSetPass(ev) {
    const passVal = ev.target.value;
    passAdmin.set(passVal)
  }
</script>

<style>
  input[type="password"] {
    text-align: center;
  }
</style>

<section class="cid-qTkAaeaxX5 mbr-reveal" id="footer1-2">

  <div
    class="mbr-overlay"
    style="background-color: rgb(60, 60, 60); opacity: 0.5;" />

  <div class="container">
    <div class="media-container-row content text-white">
      <div class="col-12 col-md-3">
        <div class="media-wrap">
          <a href="#">
            <img
              src="assets/images/hiq-logo.png"
              alt="Mobirise"
              title="" />
          </a>
        </div>
      </div>
      <div class="col-12 col-md-3 mbr-fonts-style display-7">
        <h5 class="pb-3">Address</h5>
        <p class="mbr-text">
          16/17 หมู่7 ซอยวัดสลุด
          <br />
          ถนนบางนา-ตราด กม.9 ตำบลบางแก้ว
          <br />
          อำเภอบางพลี สมุทรปราการ 10540
        </p>
      </div>
      <div class="col-12 col-md-3 mbr-fonts-style display-7">
        <h5 class="pb-3">Contacts</h5>
        <p class="mbr-text">
          Email: marketing@hiqfood.com
          <br />
          Phone: 02 750 0505
        </p>
      </div>
      <div class="col-12 col-md-3 mbr-fonts-style display-7">
        <h5 class="pb-3">Admin</h5>
        <div class="row">
          <div class="col-12">
          <div class="media-wrap">
          <p class="mbr-text">
              Password
              <br />
              <input
                on:input={(ev) => adminSetPass(ev)}
                class="input-sm"
                type="password" />
            </p>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>
