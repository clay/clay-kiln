<template>
  <div class="more-tabs">
    <button type="button" class="pane-tabs-titles-list-trigger" @click.stop="revealClick">More ^</button>
    <div class="more-tabs-popover" v-if="isOpen">
      <ul>
        <li v-for="(item, index) in items">
          <button type="button" @click.stop="itemClick(index)">{{ item }}</button>
        </li>
      </ul>
    </div>
  </div>
</template>


<script>

  export default {
    props: ['items', 'onClick', 'activeTab'],
    data() {
      return {
        isOpen: false
      }
    },
    methods: {
      itemClick(index) {
        this.revealClick();
        this.onClick(index + 3);
      },
      revealClick() {
        this.isOpen = !this.isOpen;
      }
    }
  };
</script>
