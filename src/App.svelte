<script>
  import Testimonials from "./components/Testimonials.svelte";
  import UpdateProfile from "./components/UpdateProfile.svelte";
  import Footer from "./components/Footer.svelte";
  import Header from "./components/Header.svelte";
  import Navbar from "./components/Navbar.svelte";
  import Alert, { AlertModalService } from "./Alert.svelte";
  import Loading from "./Loading.svelte";
  import { onMount } from 'svelte';
  // import Main from "./components/Main.svelte";

  const alertservice = new AlertModalService();
  onMount(() => {
    alertservice.open('ทดสอบ55', 'รายละเอียด');
  })

</script>

<style>

</style>

<Alert />
<Navbar /> 
<Header />
<UpdateProfile />
<!-- <Testimonials /> -->
<Footer />

