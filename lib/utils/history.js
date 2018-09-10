import _ from 'lodash';
import differenceInMinutes from 'date-fns/difference_in_minutes';

function updateUsersList(users, currentUser, updateTime) {
  const userIndex = _.findIndex(users, (user) => user.username === currentUser.username),
    user = _.assign({}, currentUser, { updateTime });

  if (userIndex === -1) { // the user hasn't updated the page before
    users.push(user);
  } else if (userIndex > -1) {
    // if the current user is in the list, but isn't at the end, we should move it to the end
    // (if it's already at the end, we just want to update the updateTime for the user)

    users.splice(userIndex, 1); // remove user from list
    users.push(user); // and add it to the end
  }

  return users;
}

function updateHistory(history, currentUser, updateTime) {
  let latest, userIndex;

  // If history is empty or the latest item is not an edit event, add a new edit event
  if (history.length === 0 || history[history.length - 1].action !== 'edit') {
    history.push({
      action: 'edit',
      timestamp: updateTime,
      users: [currentUser]
    });
  // latest item is an edit event, and but it doesn't contain this user, add the user to the event
  } else {
    latest = _.last(history);
    userIndex = _.findIndex(latest.users, (user) => user.username === currentUser.username);

    if (userIndex === -1) {
      latest.users.push(currentUser);
    } else if (userIndex > -1) {
      // if the current user is in the list, but isn't at the end, we should move it to the end
      latest.users.splice(userIndex, 1); // remove user from list
      latest.users.push(currentUser); // and add it to the end
    }
    latest.timestamp = updateTime;
  }

  return history;
}

export function updateStateWithEditAction(itemState, currentUser) {
  const oldHistory = itemState.history ? _.cloneDeep(itemState.history) : [],
    oldUsers = itemState.users ? _.cloneDeep(itemState.users) : [],
    updateTime = new Date().toISOString(),
    users = updateUsersList(oldUsers, currentUser, updateTime),
    history = updateHistory(oldHistory, currentUser, updateTime);

  return { updateTime, users, history };
}

/**
 * get the last user who edited a page, who ISN'T the current user
 * @param  {object} itemState
 * @param  {object} currentUser
 * @return {undefined|Object}
 */
export function getLastEditUser(itemState, currentUser) {
  const lastUser = _.findLast(itemState.users, (user) => {
    const isDifferentUser = user.username !== currentUser.username,
      isWithinFiveMinutes = Math.abs(differenceInMinutes(new Date(user.updateTime), new Date())) < 5;

    return isDifferentUser && isWithinFiveMinutes;
  });

  return lastUser;
}
