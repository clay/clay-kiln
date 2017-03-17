export default function conditionalFocus() {
  return {
    componentUpdated: (el, { value }) => {
      if (value) {
        el.focus();
      }
    }
  };
};
