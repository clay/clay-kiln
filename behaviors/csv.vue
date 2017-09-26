<docs>
  # csv

  A button that allows uploading csv data. Note: the data isn't editable once it's uploaded, but should be re-uploaded from a csv file when it needs to be changed.

  ## Arguments

  * **delimiter** _(optional)_  alternate delimiter (defaults to comma, of course)
  * **quote** _(optional)_ alternate quote to use (defaults to one double-quote)

  Note: Certain spreadsheet editors like Google Spreadsheets will use triple-quotes if you use both quotes and commas in your cells. Make sure you account for that by changing the `quote` argument:

  ```yaml
  _has:
    fn: csv
    quote: '"""'
  ```
</docs>

<style lang="sass">
  @import '../styleguide/typography';
  @import '../styleguide/buttons';

  .csv-input {
    width: .1px;
    height: .1px;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    z-index: -1;
  }

  .csv-label {
    @include button-outlined();
  }
</style>

<template>
  <div>
    <input class="csv-input" type="file" name="CSV Upload" id="kiln-csv" accept=".csv" @change="update" />
    <label class="csv-label" for="kiln-csv">{{ label }}</label>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { toObject } from 'csvjson';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        label: 'Choose a CSV file' // updated once the file is uploaded
      };
    },
    methods: {
      update(e) {
        const file = _.get(e, 'target.files[0]'),
          reader = new FileReader(),
          store = this.$store;

        reader.readAsText(file);
        reader.onload = (readEvent) => {
          const csvData = _.get(readEvent, 'target.result'),
            parsed = toObject(csvData, {
              delimiter: this.args.delimiter || ',',
              quote: this.args.quote || '"'
            });

          this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: parsed });
          this.label = 'CSV File Uploaded';
        };
        reader.onerror = () => {
          store.dispatch('showStatus', 'error', `Unable to read ${file.fileName}`);
        };
      }
    },
    slot: 'main'
  };
</script>
