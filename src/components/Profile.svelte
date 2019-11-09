<script>
  import { onMount } from "svelte";
  import { storeUserHIQ } from '../utils/store.js';
  let userId, displayName, statusMessage;
  let pictureUrl = "assets/images/nopicture.jpg";
  let userHIQ = [];

  onMount(() => {
    initLineLiff();
    storeUserHIQ.subscribe(resp => {
      userHIQ = resp;
    })
  });

  function scrollingDiv(ev) {
    const element = ev.target || ev.srcElement;
      window.scrollTo(0, document.getElementById("register").offsetTop + 700);
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
        window.alert("Error getting profile: " + error);
      });
  }

  function initGetUserProfile() {
    liff
      .getProfile()
      .then(function(profile) {
        userId = profile.userId;
        displayName = profile.displayName;
        pictureUrl = profile.pictureUrl;
        statusMessage = profile.statusMessage;
        // toggleProfileData();
      })
      .catch(function(error) {
        // window.alert('Error getting profile: ' + error);
      });
  }
</script>

<style>

</style>

<section
  class="testimonials5 cid-rHflUuqZcU mbr-parallax-background"
  id="testimonials5-3">

  <div
    class="mbr-overlay"
    style="opacity: 0.8; background-color: rgb(193, 193, 193);" />
  <div class="container">
    <div class="media-container-row">
      <div class="title col-12 align-center">
        <h2 class="pb-3 mbr-fonts-style display-2">โรซ่า</h2>
        <h3
          class="mbr-section-subtitle mbr-light pb-3 mbr-fonts-style display-5">
          ลงทะเบียนงานปีใหม่ 2020
        </h3>
      </div>
    </div>
  </div>

  <div class="container">
    <div class="media-container-column">
      <div class="mbr-testimonial align-center col-12 col-md-10">
        <div class="panel-item">
          <div class="card-block">
            <div class="testimonial-photo">
              <img src={pictureUrl} />
            </div>
            <div
              style="color:#f30000;"
              class="mbr-author-name mbr-bold mbr-fonts-style mbr-white
              display-2">
              {displayName}
            </div>
            <p style="color:white;">สถานะ : {statusMessage}</p>
            <div class="navbar-buttons mbr-section-btn">
              <a class="btn btn-sm btn-primary display-4" on:click={(ev) => scrollingDiv(ev) } >
                <span
                  class="btn-icon mbri-mobile mbr-iconfont mbr-iconfont-btn" />
                ลงทะเบียน
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</section>
