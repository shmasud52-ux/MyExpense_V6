# MyExpense V6

## কী আছে
- index.html
- style.css
- script.js
- sw.js
- manifest.webmanifest
- icons/icon-192.png
- icons/icon-512.png

## Android + Acode-এ আপডেট
1. আগে তোমার পুরোনো V5 ফোল্ডারের সব ফাইলের একটি কপি রাখো।
2. ZIP Extract করো।
3. Extract করা ফাইলগুলো তোমার বর্তমান MyExpense project folder-এ কপি করো এবং replace করতে বললে replace করো।
4. একই GitHub Pages URL / একই origin-এ অ্যাপটি খুলো। পুরোনো browser/site data বা Local Storage clear করবে না।
5. যদি পুরোনো UI দেখা যায়, অ্যাপটি একবার online খুলে refresh করো। Service Worker-এর V6 cache নতুন ফাইল লোড করবে।

## ডেটা সুরক্ষা
এই আপডেটে পুরোনো Local Storage keys রাখা হয়েছে:
- myExpenses
- mySavings
- myDailyBudget
- myExpenseV5Money
- myExpenseV5People
- myExpenseV5Theme

তবু আপডেটের আগে V5-এর Backup/Export ব্যবহার করে JSON/TXT backup রাখা জরুরি। এই ZIP-এ তোমার ফোনের Local Storage-এর ব্যক্তিগত ডেটা নেই; ডেটা ব্রাউজারেই থাকে।

## V6 পরিবর্তন
- Home page-এ Money In/Out ও Monthly Finance-এর quick links
- Panda Savings-এর daily goal edit করার সুবিধা
- Theme toggle এখন Theme Store-এর theme selection-ও persist করে
- Reports-এর date totals পুরোনো createdAt/date/timestamp field পড়তে পারে
- Date-wise history ও calendar totals-এর অপ্রয়োজনীয় repeated filtering কমানো হয়েছে
- Service Worker cache version myexpense-v6
