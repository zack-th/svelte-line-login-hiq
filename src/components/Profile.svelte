<script>
  import { onMount } from "svelte";
  import { storeUserHIQ, activeProgress } from "../utils/store.js";
  let userId,
    statusMessage = "Loading...";
  let displayName = "Loading...";
  let pictureUrl = "assets/images/nopicture.jpg";
  let userHIQ = [];

  onMount(() => {
    activeProgress.set(true);
    initLineLiff();
    storeUserHIQ.subscribe(resp => {
      userHIQ = resp;
    });
  });

  function scrollingDiv(ev) {
    const element = ev.target || ev.srcElement;
    window.scrollTo(0, document.getElementById("register").offsetTop + 550);
  }

  function initLineLiff() {
    liff
      .init({
        liffId: "1653429034-dOYJLjmb"
      })
      .then(() => {
        // start to use LIFF's api
        initGetUserProfile();
      })
      .catch(err => {
        activeProgress.set(false);
        window.alert("Error getting profile: " + error);
      });
  }

  function initGetUserProfile() {
    liff
      .getProfile()
      .then(function(profile) {
        activeProgress.set(false);
        userId = profile.userId;
        displayName = profile.displayName || "Loading...";
        pictureUrl = profile.pictureUrl;
        statusMessage = profile.statusMessage;
        // toggleProfileData();
      })
      .catch(function(error) {
        activeProgress.set(false);
        // window.alert('Error getting profile: ' + error);
      });
  }
</script>

<style>
  .panel-item {
    border-radius: 10px;
  }
</style>

<section
  class="testimonials5 cid-rHflUuqZcU mbr-parallax-background"
  id="testimonials5-3">

  <div
    class="mbr-overlay"
    style="opacity: 0.8; background-color: rgb(193, 193, 193);" />
  <!-- <div class="container">
    <div class="media-container-row">
      <div class="title col-12 align-center">
        <h2 class="pb-3 mbr-fonts-style display-2">โรซ่า</h2>
        <h3
          class="mbr-section-subtitle mbr-light pb-3 mbr-fonts-style display-5">
          ลงทะเบียนงานปีใหม่ 2020
        </h3>
      </div>
    </div>
  </div> -->

  <div class="container">
    <div class="media-container-column" style="border-radius: 25px;">
      <div class="mbr-testimonial align-center col-12 col-md-10">
        <div class="panel-item">
          <div class="card-block">
            <div class="testimonial-photo">
              <img src={pictureUrl} />
            </div>
            <div
              style="color:#727272;"
              class="mbr-author-name mbr-bold mbr-fonts-style mbr-white
              display-2">
              {displayName}
            </div>
            <p style="color: #f30105;">สถานะ : {statusMessage}</p>
            <div style="margin-top:20px;" class="navbar-buttons mbr-section-btn">
              <a
                style="cursor:pointer;"
                class="btn btn-sm btn-danger display-7"
                on:click={ev => scrollingDiv(ev)}>
                <i class="mbri-edit"></i>
                <span
                  class="btn-icon mbr-iconfont mbr-iconfont-btn" />
                ลงทะเบียน
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</section>
