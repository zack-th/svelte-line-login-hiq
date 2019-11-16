<script context="module">
  import { onMount } from "svelte";
  import { modalService } from "./utils/store.js";

  let title, detail;

  export class AlertModalService {
    open(_title, _detail) {
      title = _title;
      detail = _detail;
      window.$("#alertModal").modal("show");
    }

    close() {
      window.$("#alertModal").modal("hide");
    }

    get getTitle() {
      return this.title;
    }
  }

  setTimeout(() => {
    alert(title)
  }, 5000)


  function closeModal() {
    window.$("#alertModal").modal("hide");
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
        <input bind:value= {title}>
        <h5 class="modal-title" id="alertModalLabel">{title}</h5>
        <button
          type="button"
          class="close"
          data-dismiss="modal"
          aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">{detail}</div>
      <div class="modal-footer">
        <button
          on:click={() => closeModal()}
          type="button"
          class="btn btn-primary">
          ตกลง
        </button>
      </div>
    </div>
  </div>
</div>
