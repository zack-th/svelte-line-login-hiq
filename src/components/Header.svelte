<script>
	import { onMount } from "svelte";
  import { storeUserHIQ, activeProgress } from "../utils/store.js";
  let userId,
    statusMessage = "Loading...";
  let displayName = "Loading...";
  let pictureUrl = "img/no-profile.png";
  let userHIQ = [];

  onMount(() => {
    activeProgress.set(true);
    initLineLiff();
    storeUserHIQ.subscribe(resp => {
      userHIQ = resp;
    });
  });

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
			
</style>
<div id="showcase">
  <div class="row showcase-caption">
    <div class="col">
      <div class="teams-item-box">
        <div class="teams-item">
          <div class="profile-image">
            <img src={pictureUrl} alt="Jen Image" />
          </div>
          <div>
            <h5>{displayName}</h5>
            <h3>สถานะ : {statusMessage}</h3>
            <a href="#features" class="button-style showcase-btn">ลงทะเบียน</a>
            <!-- <div class="showcase-button">
              <div class="icons">
                <a href="#0">
                  <i class="fa fa-facebook" aria-hidden="true" />
                </a>
                <a href="#0">
                  <i class="fa fa-twitter" aria-hidden="true" />
                </a>
                <a href="#0">
                  <i class="fa fa-linkedin" aria-hidden="true" />
                </a>
              </div>
            </div> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<!-- <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#alertModal">
  Launch demo modal
</button> -->