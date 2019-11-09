<script>
  import Profile from "./Profile.svelte";
  import Footer from "./Footer.svelte";
  import Navbar from "./Navbar.svelte";
  import Table from "./Table.svelte";
  import { storeUserHIQ } from "../utils/store.js";
  import { onMount } from "svelte";

  // import './assets/datatables/jquery.data-tables.min.js'
  // import DataTable from './assets/datatables/data-tables.bootstrap4.min.js'
  let userFileter = [];
  let userOneFill = [];
  const production = !!process.env.NODE_ENV;

  onMount(() => {
    storeUserHIQ.subscribe(resp => {
      console.log(resp)
      if (typeof resp === "object" && resp.length > 0) {
        userFileter = resp;
      } else {
        userOneFill = [resp["data"]];
      } 
    });
  });

  //   function initializeApp() {
  //     // document.getElementById('browserLanguage').textContent = "browserLanguage : " + liff.getLanguage();
  //     // document.getElementById('sdkVersion').textContent = "sdkVersion : " + liff.getVersion();
  //     // document.getElementById('isInClient').textContent = "isInClient : " + liff.isInClient();
  //     // document.getElementById('isLoggedIn').textContent = "isLoggedIn : " + liff.isLoggedIn();
  //     // document.getElementById('deviceOS').textContent = "deviceOS : " + liff.getOS();

  //     document.getElementById('liffLogoutButton').addEventListener('click', function () {
  //         if (liff.isLoggedIn()) {
  //             liff.logout();
  //             alert('logout')
  //             window.location.reload();
  //         }
  //     });

  //     document.getElementById('liffLoginButton').addEventListener('click', function () {
  //         if (!liff.isLoggedIn()) {
  //             // set `redirectUri` to redirect the user to a URL other than the front page of your LIFF app.
  //             liff.login();
  //         }
  //     });

  //     document.getElementById('openWindowButton').addEventListener('click', function() {
  //         liff.openWindow({
  //             url: 'https://line.me',
  //             external: true
  //         });
  //     });

  //     document.getElementById('scanQrCodeButton').addEventListener('click', function() {
  //         if (!liff.isInClient()) {
  //             // sendAlertIfNotInClient();
  //         } else {
  //             liff.scanCode().then(result => {
  //                 // e.g. result = { value: "Hello LIFF app!" }
  //                 const stringifiedResult = JSON.stringify(result);
  //                 document.getElementById('scanQrField').textContent = "scanQrField : " + stringifiedResult;
  //                 // toggleQrCodeReader();
  //             }).catch(err => {
  //                 document.getElementById('scanQrField').textContent = "scanCode failed!";
  //             });
  //         }
  //     });

  //     document.getElementById('getAccessToken').addEventListener('click', function() {
  //         if (!liff.isLoggedIn() && !liff.isInClient()) {
  //             alert('To get an access token, you need to be logged in. Please tap the "login" button below and try again.');
  //         } else {
  //             const accessToken = liff.getAccessToken();
  //             document.getElementById('accessTokenField').textContent = accessToken;
  //             // toggleAccessToken();
  //         }
  //     });

  //     document.getElementById('getProfileButton').addEventListener('click', function() {
  //         liff.getProfile().then(function(profile) {
  //             document.getElementById('userIdProfileField').textContent = profile.userId;
  //             document.getElementById('displayNameField').textContent = profile.displayName;

  //             const profilePictureDiv = document.getElementById('profilePictureDiv');
  //             if (profilePictureDiv.firstElementChild) {
  //                 profilePictureDiv.removeChild(profilePictureDiv.firstElementChild);
  //             }
  //             const img = document.createElement('img');
  //             img.src = profile.pictureUrl;
  //             img.alt = 'Profile Picture';
  //             img.width = '100px';
  //             img.height = '100px';
  //             profilePictureDiv.appendChild(img);

  //             document.getElementById('statusMessageField').textContent = profile.statusMessage;
  //             // toggleProfileData();
  //         }).catch(function(error) {
  //             window.alert('Error getting profile: ' + error);
  //         });
  //     });
  // }
</script>

<Navbar />
<Profile />
<Table bind:userFileter={userFileter} bind:userOneFill={userOneFill} />
<Footer />
