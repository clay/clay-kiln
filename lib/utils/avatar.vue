<style lang="sass">
  .kiln-avatar {
    flex: 0 0 auto;
  }
</style>

<template>
  <avatar class="kiln-avatar" :username="username" :src="imageURL" :size="pixelSize" :rounded="true"></avatar>
</template>

<script>
  import _ from 'lodash';
  import Avatar from 'vue-avatar';

  export default {
    props: ['url', 'size', 'name'],
    computed: {
      username() {
        if (_.includes(this.name, ' ')) {
          // if a name has spaces, it'll generate a nice avatar
          return this.name;
        } else if (_.includes(this.name, '@')) {
          // probably an email
          const beforeAt = this.name.match(/(.*?)@/)[1];

          return beforeAt.split(/\W/).join(' '); // split everything before the @ by anything that's not a letter/digit/underscore
        } else if (!_.isEmpty(this.name)) {
          // some other kind of username, just use the first letter
          return this.name[0];
        } else {
          return 'Walter Plinge'; // https://www.wikiwand.com/en/Walter_Plinge
        }
      },
      imageURL() {
        // only display the image if it's not the default google avatar
        if (this.url && this.url.length && this.url !== 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50') {
          return this.url;
        } else if (this.url && this.url === 'kiln-clay-avatar') {
          // special kiln avatar
          // note: we're referencing it from amphora-search instead of hardcoding it so we can
          // 1) change it as needed and
          // 2) not deal with new 5.6kB strings every time the clay user is referenced in the page / layout histories
          return 'data:image/png;base64,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';
        }
      },
      pixelSize() {
        switch (this.size) {
          case 'small': return 24;
          default: return 40;
        }
      }
    },
    components: {
      Avatar
    }
  };
</script>
