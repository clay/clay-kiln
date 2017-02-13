<template>
  <div class="kiln-toolbar-pane-background">
    <div class="kiln-toolbar-pane">
      <header class="pane-tabs">
        <div class="pane-tabs-inner">
          <pane-tab v-for="item in tabs" :item="item"></pane-tab>
        </div>
      </header>
      <div class="pane-inner">
        <pane-content v-for="item in contents" :item="item"></pane-content>
      </div>
    </div>
  </div>
</template>
