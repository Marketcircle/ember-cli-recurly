import Service from '@ember/service';
import EmberObject from '@ember/object';
import { Promise } from 'rsvp';
import { computed } from '@ember/object';

export default (Service || EmberObject).extend({
  token: null,

  getToken: function(billingInfo) {
    let self = this;
    return new Promise(function(resolve, reject) {
      recurly.token(billingInfo, function(err, token) {
        if(err) {
          reject(err);
        } else {
          self.set('token', token);
          resolve(token);
        }
      });
    });
  },

  getBankInfo: function(routingNumber) {
    let lookupData = {
      routingNumber: routingNumber.toString()
    }

    return new Promise(function(resolve, reject) {
      recurly.bankAccount.bankInfo(lookupData, function(err, bankInfo) {
        if(err) {
          reject(err);
        } else {
          resolve(bankInfo)
        }
      });
    });
  },

  /* Valid options are: braintree and description.
   * See https://dev.recurly.com/docs/paypal#section-recurlypaypal
   * for more details.
   */
  payPal: function(options) {
    return new Promise(function(resolve, reject) {
      const paypal = recurly.PayPal(options);
      paypal.on('token', resolve);
      paypal.on('error', reject);
      paypal.on('cancel', reject);
      paypal.start(options);
    });
  },

  /* Valid options are: plan, planQuantity, currency, addons,
   * coupon, giftCard, country, postalCode, taxCode, vatNumber.
   * See https://dev.recurly.com/docs/pricing#section-input-elements
   * for more details.
   */
  getPricing: function(options) {
    return new Promise(function(resolve, reject) {
      let pricing = recurly.Pricing()
        .plan(options.plan, options.planQuantity)
        .currency(options.currency)

      options.addons.forEach(function (addon) {
        pricing.addon(addon.name, { quantity: addon.quantity });
      });

      if (options.coupon) {
        pricing.coupon(options.coupon);
      }

      if (options.giftCard) {
        pricing.giftcard(options.giftCard);
      }

      if (options.country || options.postalCode) {
        pricing.address({
          country: options.country,
          postal_code: options.postalCode
        });

      }

      if (options.taxCode || options.vatNumber) {
        pricing.tax({
          tax_code: options.taxCode,
          vat_number: options.vatNumber
        });
      }

      return pricing
        .catch(function(err){
          reject(err);
        })
        .done(function(price){
          resolve(price)
        });
    });
  },

  on: function(event, callback) {
    recurly.on(event, callback);
  },

  off: function(event) {
    recurly.off(event);
  },

  parent: function() {
    recurly.parent();
  },

  config: computed(() => recurly.config)
});
