<script>
  import Details from "src/components/Details.svelte";
  import UpdateProfile from "src/components/UpdateProfile.svelte";
  import Footer from "src/components/Footer.svelte";
  import Header from "src/components/Header.svelte";
  import Navbar from "src/components/Navbar.svelte";
  import ModalAlert from "src/ModalAlert.svelte";
  import Loading from "src/Loading.svelte";
  import { onMount } from "svelte";
  import { modalService } from "src/utils/store.js";
  import { activeProgress } from "src/utils/store.js";
  // import Main from "./components/Main.svelte";
  // modalService.set({ status: "open", title: "test", detail: "detail" });

  activeProgress.set(true);
</script>

<style>

</style>

<Loading />
<ModalAlert />
<Navbar />
<Header />
<UpdateProfile />
<Details />
<Footer /> 
