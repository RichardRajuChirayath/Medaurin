# 🎨 India Government Verification - Badge Guide

## ℹ️ **What Do the Badges Mean?**

When you view your medicine expenses, you'll see colorful badges next to each medicine. Here's what they mean:

---

### 🔴 **BANNED IN INDIA**
**Color:** Red (animated pulsing)  
**Meaning:** This medicine is **prohibited by CDSCO** (Central Drugs Standard Control Organization)  
**What to do:** 
- ⚠️ **DO NOT PURCHASE** this medicine
- 🩺 Consult your doctor immediately
- 🔔 You'll receive an FCM alert notification
- 📋 See ban reason in details panel

**Example:** Nimesulide (banned due to liver damage risk)

---

### 🟡 **MAY BE OVERPRICED**
**Color:** Amber/Yellow  
**Meaning:** You paid **more than NPPA government ceiling price**  
**What to do:**
- 💰 Check the details panel for govt vs actual price
- 🏪 Consider switching to cheaper pharmacy
- 📊 Track pharmacy spending to find best deals
- 🔔 You'll receive a price alert notification

**Example:** Paracetamol - Govt ceiling ₹1.50/tablet, you paid ₹2.50/tablet

---

### 🟢 **GOVT APPROVED**
**Color:** Green  
**Meaning:** Medicine is **approved by CDSCO** and price is fair  
**What it means:**
- ✅ Safe and legal in India
- ✅ Manufacturer is licensed
- ✅ Price is at or below govt ceiling (if controlled)
- 📋 Full verification details available

**Example:** Metformin - Approved, ₹18 for 10 tablets (below ₹20 ceiling)

---

### ⚪ **NOT IN DATABASE**
**Color:** Gray  
**Meaning:** Medicine **not found** in CDSCO or NPPA databases  
**What it means:**
- 🔍 Not in our current dataset (12 CDSCO + 10 NPPA medicines)
- ⚖️ Could be new, branded, or alternative medicine
- 📝 Still tracked in your expenses
- 🔄 Database will expand with updates

**Note:** This doesn't mean the medicine is unsafe - just that we don't have govt data for it yet.

---

## 🎯 **Quick Reference Card**

| Badge | Status | Action Needed | Alert Sent |
|-------|--------|---------------|------------|
| 🔴 **BANNED** | Prohibited | Don't buy, see doctor | ✅ Yes (Critical) |
| 🟡 **OVERPRICED** | Above price | Consider cheaper option | ✅ Yes (Warning) |
| 🟢 **APPROVED** | Verified safe | None, all good! | ❌ No |
| ⚪ **UNKNOWN** | No data | None | ❌ No |

---

## 📱 **Where You'll See These Badges**

### 1. **Expense List**
Every medicine in your expense list shows its badge prominently at the top.

### 2. **Details Panel**
Click to expand and see:
- Govt approval status (APPROVED/BANNED/UNKNOWN)
- Manufacturer name & license
- NPPA ceiling price (if available)
- Price comparison
- All verification alerts

### 3. **Notifications**
FCM push notifications for:
- 🔴 Banned medicines (critical alert)
- 🟡 Overpriced medicines (warning)

---

## 🇮🇳 **How Verification Works**

### **Step-by-Step:**

1. **You add expense** (OCR, manual, or email)
2. **Auto-verify** against local CDSCO database
3. **Check** NPPA price ceiling
4. **Assign badge** based on results
5. **Send alert** if banned or overpriced
6. **Display badge** on expense

**Time taken:** < 100ms (all local, no API calls!)

---

## 📊 **What Gets Verified**

### **CDSCO Check (Drug Approval):**
✅ Is medicine approved in India?  
✅ Is it banned?  
✅ Who is the manufacturer?  
✅ What's the license number?  

### **NPPA Check (Price Control):**
✅ Is medicine price-controlled?  
✅ What's the govt ceiling price?  
✅ Did you pay more?  
✅ How much could you save?  

---

## 💡 **Tips for Users**

### **If You See BANNED:**
1. Stop taking the medicine
2. Consult doctor immediately
3. Check why it was banned (details panel)
4. Ask for safe alternative

### **If You See OVERPRICED:**
1. Check govt ceiling price
2. Calculate how much extra you paid
3. Note which pharmacy charged more
4. Switch to cheaper pharmacy next time
5. Use Pharmacy Finder to find best deals

### **If You See APPROVED:**
1. All good! Medicine is safe
2. Check if you want to see manufacturer
3. No action needed

### **If You See UNKNOWN:**
1. Medicine not in our database yet
2. Still tracked in your expenses
3. No govt verification available
4. Database will grow with updates

---

## 🔮 **Future Updates**

We're constantly expanding our verification database:

**Coming Soon:**
- 📈 1,000+ medicines in CDSCO database
- 💊 More NPPA price-controlled medicines
- 🔄 Monthly dataset updates
- 🌍 Regional price variations
- 💡 Generic alternative suggestions

---

## ❓ **FAQ**

**Q: Why is my medicine showing UNKNOWN?**  
A: It's not in our current 12-medicine CDSCO dataset. We're expanding this regularly!

**Q: Can I trust the BANNED badge?**  
A: Yes! Data is from official CDSCO bans. But always consult your doctor.

**Q: How accurate is the OVERPRICED detection?**  
A: Very accurate! We allow 20% margin above govt price (for pharmacy profits). If you exceed that, you're flagged.

**Q: What if APPROVED medicine gave me side effects?**  
A: "Approved" means legal in India, not that it's perfect for YOU. Always consult your doctor about side effects.

**Q: Can I add medicines to the database?**  
A: Currently, we're using official govt datasets. Future updates will expand coverage automatically.

---

## 🎊 **Remember**

These badges are **informational tools** to help you:
- 💰 Save money
- ⚠️ Stay safe
- 🏥 Have informed doctor discussions
- 📊 Track spending better

**They are NOT medical advice!** Always consult healthcare professionals for medical decisions.

---

**MixSafe - Making Healthcare Transparent for India! 🇮🇳**
