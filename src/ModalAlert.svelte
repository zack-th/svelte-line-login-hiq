<script>
  import { onMount } from "svelte";
  import { modalService } from "src/utils/store.js";

  let title = "";
  let detail = "";
  let inputFocus;

  modalService.subscribe(resp => {
    title = resp.title;
    detail = resp.detail;
    if (resp.focusName) {
      inputFocus = document.getElementsByName(resp.focusName);
    }

    if (resp.status === "open") {
      open();
    } else {
      close();
    }
  });

  function focusInput(id) {
    console.log("focusId ", id);
    document.getElementById(id).focus();
  }

  function open() {
    window.$("#alertModal").modal("show");
  }

  function close() {
    window.$("#alertModal").modal("hide");
    setTimeout(() => {
      if (inputFocus) {
        inputFocus[0].focus();
      }
    }, 500);
  }
</script>

<style>

</style>

<!-- Modal -->
<div
  class="modal fade"
  id="alertModal"
  tabindex="-1"
  role="dialog"
  aria-labelledby="alertModalLabel"
  aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="alertModalLabel">{title}</h5>
        <button
          type="button"
          class="close"
          data-dismiss="modal"
          aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">{@html detail}</div>
      <div class="modal-footer">
        <button on:click={() => close()} type="button" class="btn btn-primary">
          ตกลง
        </button>
      </div>
    </div>
  </div>
</div>
