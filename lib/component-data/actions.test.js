import _ from 'lodash';
import * as model from './model';
import * as template from './template';
import * as api from '../core-data/api';
import * as component from '../core-data/components';
import * as lib from './actions';

describe('reactive render', () => {
  const uri = 'domain.com/components/foo',
    data = { a: 'b' };
    // eventID: 'kansdkfjansdf',
    // snapshot: false,
    // prevData: { c: 'd' };

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(model);
    sandbox.stub(template);
    sandbox.stub(api);
    sandbox.stub(component);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('saveComponent', () => {
    const fn = lib.saveComponent;

    it('does not save when data has not changed', () => {
      return fn({ dispatch: _.noop }, { uri, data, prevData: data }).then((res) => {
        expect(res).to.equal(undefined);
      });
    });
  });
});
