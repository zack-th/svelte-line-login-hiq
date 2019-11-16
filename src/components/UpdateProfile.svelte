<script>
  import { onMount } from "svelte";
  let formInput;

  onMount(() => {
    
  });

  function validForm() {
    if(!inputIsEmpty()) {
      alert('ok');
    }
  }

  function inputIsEmpty() {
    let isnull = false;
    Object.keys(formInput).filter(key => {
        if(!isnull && !formInput[key].value && (formInput[key].type === 'text' || formInput[key].type === 'password') ) {
          // alert(formInput[key]['name']);
          formInput[key].focus();
          isnull = !isnull;
        }
      });
    return isnull;
  }
</script>

<style>

</style>

<div id="features">
  <div class="text-center features-caption features">
    <div class="container">
      <div class="row">
        <div class="col-sm-12 col-md-12 offset-md-12 col-lg-12">
          <div class="text-center features-caption features">
            <h4 style="color: #FF5733;">
              กรุณาตรวจสอบสิทธิ์ โดยกรอกข้อมูลส่วนตัว
              <br />
              <b>(ชื่อ/สกุล/วันเกิด)</b>
            </h4>
          </div>
          <form bind:this={formInput}>
            <div class="row">
              <div class="col-md-6 form-group">
                <input
                  name="fname"
                  type="text"
                  class="form-control"
                  placeholder="ชื่อ"
                  required />
              </div>
              <div class="col-md-6 form-group">
                <input
                  name="lname"
                  type="text"
                  class="form-control"
                  placeholder="นามสกุล"
                  required />
              </div>
              <div class="col-md-6 form-group">
                <input
                  name="birth"
                  type="text"
                  class="form-control"
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
          <p style="color: #FF5733;">
            หมายเหตุ : ลงทะเบียนเพื่อ
            <b style="color: #F92604;">ลุ้นของรางวัล</b>
            <br />
            ภายในงาน
          </p>
          <!-- Ending of ajax contact form -->
          <!-- Starting of successful form message -->
          <div class="row">
            <div class="col-12">
              <div class="alert alert-success contact__msg" role="alert">
                Your message was sent successfully.
              </div>
            </div>
          </div>
          <!-- Ending of successful form message -->
        </div>
      </div>
    </div>
  </div>
</div>
