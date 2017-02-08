import { includes } from 'lodash';
import keycode from 'keycode';
import toggleEdit from './toggle-edit';

let secretKilnKey = '';

/**
 * show clay logo
 */
function showLogo() {
  var logo = document.querySelector('.clay-kiln-logo');

  if (logo) {
    logo.classList.add('show');
  }
}

/**
 * add listeners for shift + CLAY to the document
 */
export default function addListeners() {
  /**
   * listen for shift + C L A Y
   * when users hit that, show the logo (then enter edit mode on keyup)
   */
  document.addEventListener('keydown', function (e) {
    const key = keycode(e);

    if (includes(['c', 'l', 'a', 'y'], key) && e.shiftKey === true) {
      secretKilnKey += key;
    } else {
      // if we hit any other character, reset the key
      secretKilnKey = '';
    }

    // check secret key
    if (secretKilnKey === 'clay') {
      showLogo();
    } else if (secretKilnKey.length > 4 && includes(secretKilnKey, 'clay')) {
      toggleEdit();
    } else if (secretKilnKey.length > 4) {
      // if we hit more than four characters, reset the key
      secretKilnKey = '';
    }
  });

  document.addEventListener('keyup', function () {
    if (secretKilnKey === 'clay') {
      toggleEdit();
    }
  });
}
