<script>
  import Search from "./Search.svelte";
  export let userFileter = [];
</script>

<style>
  .section-table {
    margin-top: 30px;
  }
</style>

<hr />
<section class="section-table cid-rHfxX4jQGN" id="table1-4">

  <div class="container container-table">
    <Search />
    <div class="container scroll">
      <table class="table isSearch" cellspacing="0">
        <thead>
          <tr class="table-heads ">
            <th class="head-item mbr-fonts-style display-5">รหัส</th>
            <th class="head-item mbr-fonts-style display-5">ชื่อ-สกุล</th>
            <th class="head-item mbr-fonts-style display-5">วันเกิด</th>
          </tr>
        </thead>
        <tbody>
          {#each userFileter as user}
            <tr>
              <td class="body-item mbr-fonts-style display-7">
                {user.data.id}
              </td>
              <td class="body-item mbr-fonts-style display-7">
                {`${user.data.title} ${user.data.fname} ${user.data.lname}`}
              </td>
              <td class="body-item mbr-fonts-style display-7">
                {`${user.data.birth}`}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="container table-info-container">
      <div class="row info">
        <div class="col-md-6">
          <div class="dataTables_info mbr-fonts-style display-7">
            <span class="infoBefore">Showing</span>
            <span class="inactive infoRows" />
            <span class="infoAfter">entries</span>
            <span class="infoFilteredBefore">(filtered from</span>
            <span class="inactive infoRows" />
            <span class="infoFilteredAfter">total entries)</span>
          </div>
        </div>
        <div class="col-md-6" />
      </div>
    </div>
  </div>
</section>
