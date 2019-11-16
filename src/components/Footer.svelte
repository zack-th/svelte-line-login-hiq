<script>
	import { passAdmin } from "../utils/store.js";

  function adminSetPass(ev) {
    const passVal = ev.target.value;
    passAdmin.set(passVal)
  }
</script>
			
<style>
			
</style>
<footer class="text-center pos-re">
    <div class="container">
      <div class="footer__box">
        <!-- Logo -->
        <a class="logo" href="#">
            <img src="img/logo-light.png" alt="logo">
        </a>

        <div class="social">
            <a href="#0"><i class="fa fa-facebook" aria-hidden="true"></i></a>
            <a href="#0"><i class="fa fa-twitter" aria-hidden="true"></i></a>
            <a href="#0"><i class="fa fa-linkedin" aria-hidden="true"></i></a>
        </div>

        <p>&copy; 2018 Dejithemes. All Rights Reserved.</p>
      </div>
    </div>

    <div class="curve curve-top curve-center"></div>
</footer>