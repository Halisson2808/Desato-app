require('esbuild').buildSync({
  stdin: { contents: "export { createClient } from '@supabase/supabase-js';", resolveDir: process.cwd(), sourcefile: 'supabase-entry.js' },
  bundle: true, format: 'esm', platform: 'browser', target: ['es2020'],
  minify: true, outfile: 'public/vendor/supabase.js', legalComments: 'eof'
});
console.log('SDK Supabase empacotado localmente.');
