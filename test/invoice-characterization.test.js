const test = require('node:test');
const assert = require('node:assert/strict');

const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');

test('CURRENT BEHAVIOUR: order pricing applies HSN slab to post-discount taxable value', () => {
  const items = [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }];
  const totals = pricing.computeTotals(items, 'WELCOME');

  assert.deepEqual(
    { subtotal: totals.subtotal, discount: totals.discount, taxable: totals.taxable, tax: totals.tax, total: totals.total },
    { subtotal: 100, discount: 5, taxable: 95, tax: 4.75, total: 99.75 }
  );
});

test('invoice figures match the billed HSN slab and coupon totals', () => {
  const items = [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }];
  const billed = pricing.computeTotals(items, 'WELCOME');
  const figures = invoice.computeInvoiceFigures({ items, coupon: 'WELCOME' });

  assert.deepEqual(
    { subtotal: figures.subtotal, discount: figures.discount, tax: figures.tax, total: figures.total },
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, total: billed.total }
  );
  assert.equal(figures.rows[0].gstPercent, billed.lines[0].gstPercent);
  assert.equal(figures.rows[0].lineTax, billed.lines[0].tax);
});

test('invoice renders the billed CGST and SGST split separately', () => {
  const items = [{ name: 'Rice', hsn: '1006', price: 100, qty: 1 }];
  const billed = pricing.computeTotals(items, 'WELCOME');
  const html = invoice.render({ id: 11, items, coupon: 'WELCOME', total: billed.total });

  assert.match(html, /CGST/);
  assert.match(html, /SGST/);
  assert.match(html, /2\.38/);
  assert.match(html, /2\.37/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
