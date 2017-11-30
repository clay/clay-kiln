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
