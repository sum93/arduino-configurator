Vue.component('result-code', {
  props: [
    'resultCode',
    'getCode'
  ],
  computed: {
    numberOfCodeLines: function () {
      var lines = this.resultCode.split('\n').length;
      if (lines == 1)
        return 5;
      return lines;
    }
  },
  template: `
    <div>
      <div class="form-group row my-3">
        <div class="col-12">
          <button type="button" v-on:click="getCode()" class="btn btn-arduino col-12">Get your code!</button>
        </div>
      </div>
      <div class="row col-12 p-0 m-0">
        <label for="result"><b>Your Code:</b></label>
        <textarea class="form-control result-code" v-bind:value="resultCode" id="result" v-bind:rows="numberOfCodeLines"></textarea>
      </div>
      <div class="form-group row my-3">
        <div class="col-12">
          <button type="button" v-on:click="copyCode()" class="btn btn-arduino col-12">Copy to clipboard!</button>
        </div>
      </div>
    </div>
  `,
  methods: {
    copyCode: function copyCode () {
      var code = document.getElementById("result");
      code.select();
      document.execCommand("Copy");
    }
  },
})
