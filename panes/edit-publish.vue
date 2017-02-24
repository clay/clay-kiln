<template>
  <div>
    <h4>Publish Pane Placeholder</h4>
    <button type="button" @click.stop="onPublishClick">Publish</button>
    <button type="button" @click.stop="onScheduleClick">Schedule</button>
  </div>
</template>


<script>
  import _ from 'lodash';

  export default {
    props: [],
    data() {
      return {}
    },
    methods: {
      onPublishClick() {
        console.log('Publish stuff');
      },
      onScheduleClick() {
        console.log('Schedule stuff');
      }
    },
    components: {}
  };
</script>
