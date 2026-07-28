const { parseDealFields } = require('./ocrParse');
let pass=0, fail=0;
function t(desc, lines, expect){
  const got = parseDealFields(lines);
  const ok = Object.keys(expect).every((k) => got[k] === expect[k]);
  if(ok){pass++; console.log('  ok  ', desc);}
  else {fail++; console.log('  FAIL', desc, '| expected', JSON.stringify(expect), '| got', JSON.stringify(got));}
}
const crm = [
  'FiberCo Sales Portal','Dashboard','Orders','Customers','Reports','Settings',
  'Order Confirmation','Order #  884213','Status  Pending Install','Plan Details',
  'Package  Gig Fiber 1000','Speed  1000 Mbps','Monthly  $79.99','Promo  3 months free',
  'Equipment','Router  Included','Install Fee  Waived','Contract  24 months',
  'Customer Information','Customer Name: Jordan Whitfield','Service Address: 1423 W Oak Ridge Dr',
  'Phone Number: (555) 212-8890','Email  jordan@example.com',
];
t('CRM screen, customer block below line 20', crm, {name:'Jordan Whitfield',firstName:'Jordan',lastName:'Whitfield',address:'1423 W Oak Ridge Dr',phone:'(555) 212-8890'});
t('no colon after label', ['Order Summary','Customer Name Jordan Whitfield','Service Address 88 Elm Street','Phone 5552128890'], {name:'Jordan Whitfield',address:'88 Elm Street',phone:'(555) 212-8890'});
t('label alone, value next line', ['Customer Name','Maria Delgado','Service Address','940 Sunset Blvd','Phone','555-771-2003'], {name:'Maria Delgado',address:'940 Sunset Blvd',phone:'(555) 771-2003'});
t('value two lines below label', ['Service Address','','2210 Harbor Point Rd'], {address:'2210 Harbor Point Rd'});
t('separate first/last labels', ['First Name: Sam','Last Name: Taggart','Street Address: 12 Birch Ln'], {name:'Sam Taggart',firstName:'Sam',lastName:'Taggart',address:'12 Birch Ln'});
t('unlabelled paperwork fallback', ['Robert Mackenzie','4820 Cedar Crossing','(555) 664-1180'], {name:'Robert Mackenzie',address:'4820 Cedar Crossing',phone:'(555) 664-1180'});
t('headings are not names', ['Order Confirmation','Total Due','Account Balance','Customer Name: Dana Reyes'], {name:'Dana Reyes'});
t('lookahead stops at next label', ['Customer Name','Phone Number','555-100-2000'], {name:undefined});
t('11-digit country code', ['Phone: 1 (555) 300-4000'], {phone:'(555) 300-4000'});
t('empty input safe', [], {});
t('label word alone never becomes a value', ['Customer Name'], {name:undefined});
console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
