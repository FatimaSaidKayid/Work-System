// ==============================
// إعدادات النظام
// ==============================

// أول يوم عمل معروف.
// يمكنك تغييره إلى تاريخ حقيقي للعامل.
let referenceDateInput = document.getElementById("referenceDate");

const todayDate = document.getElementById("todayDate");
const monthPicker = document.getElementById("monthPicker");

const checkBtn = document.getElementById("checkBtn");
const monthBtn = document.getElementById("monthBtn");

const todayResult = document.getElementById("todayResult");
const statusBox = document.getElementById("statusBox");
const selectedDate = document.getElementById("selectedDate");
const nextWork = document.getElementById("nextWork");
const followingWork = document.getElementById("followingWork");

const monthSummary = document.getElementById("monthSummary");
const workDays = document.getElementById("workDays");

const weekdayNames = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت"
];

// وضع تاريخ اليوم تلقائيًا
const now = new Date();
todayDate.value = formatInputDate(now);

// وضع الشهر الحالي تلقائيًا
monthPicker.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

// --------------------------------
// أدوات التاريخ
// --------------------------------

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatArabicDate(date) {
  return `${weekdayNames[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(start, end) {
  const oneDay = 24 * 60 * 60 * 1000;

  const startUTC = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );

  const endUTC = Date.UTC(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );

  return Math.round((endUTC - startUTC) / oneDay);
}

// --------------------------------
// حساب دورة العمل
// --------------------------------

/*
  الدورة الأساسية:
  يوم عمل + 3 أيام إجازة = 4 أيام.

  لكن إذا كان يوم العمل يوم الخميس:
  يصبح الخميس + الجمعة يومي عمل،
  ثم تبدأ 3 أيام إجازة من السبت.

  لذلك نحسب الدورة بشكل متتابع بدل الاعتماد
  على باقي القسمة فقط.

  الجمعة المنفردة (التي تقع كيوم دورة بعد الخميس + الجمعة)
  تُعتبر إجازة، وتُحسب 3 أيام إجازة بعدها كالمعتاد.
*/

function buildScheduleUntil(targetDate) {
  const referenceDate = parseDate(referenceDateInput.value);

  if (isNaN(referenceDate.getTime())) {
    throw new Error("يرجى إدخال تاريخ أول يوم عمل.");
  }

  if (targetDate < referenceDate) {
    return buildScheduleBackward(referenceDate, targetDate);
  }

  const workDates = [];
  let current = new Date(referenceDate);

  while (current <= targetDate) {
    // الجمعة المنفردة (التي تأتي بعد الخميس + الجمعة) تكون إجازة.
    // ومع ذلك تبقى الدورة كما هي: تُحسب 3 أيام إجازة بعدها.
    if (current.getDay() !== 5) {
      workDates.push(new Date(current));
    }

    // الخميس = 4
    if (current.getDay() === 4) {
      // الجمعة أيضًا يوم عمل
      const friday = addDays(current, 1);

      if (friday <= targetDate) {
        workDates.push(friday);
      }

      // بعد الخميس + الجمعة: 3 أيام إجازة
      current = addDays(current, 4); // الاثنين التالي
    } else {
      // بعد يوم العمل: 3 أيام إجازة
      current = addDays(current, 4);
    }
  }

  return workDates;
}

// في حالة اختيار تاريخ قبل تاريخ البداية
function buildScheduleBackward(referenceDate, targetDate) {
  const workDates = [];
  let current = new Date(referenceDate);

  while (current >= targetDate) {
    // الجمعة المنفردة = إجازة (نفس القاعدة في الحساب للخلف)
    if (current.getDay() !== 5) {
      workDates.push(new Date(current));
    }

    if (current.getDay() === 4) {
      // قبل الخميس يوجد نظام الخميس + الجمعة.
      // نرجع إلى يوم العمل السابق بفارق 4 أيام.
      current = addDays(current, -4);
    } else {
      current = addDays(current, -4);
    }
  }

  return workDates;
}

function isWorkDay(date) {
  const schedule = buildScheduleUntil(date);

  return schedule.some(
    d => formatInputDate(d) === formatInputDate(date)
  );
}

function getNextWorkDay(date) {
  let candidate = addDays(date, 1);

  for (let i = 0; i < 1000; i++) {
    if (isWorkDay(candidate)) {
      return candidate;
    }

    candidate = addDays(candidate, 1);
  }

  return null;
}

function getFollowingWorkDay(date) {
  let candidate = addDays(date, 1);

  let foundFirst = false;

  for (let i = 0; i < 1000; i++) {
    if (isWorkDay(candidate)) {
      if (!foundFirst) {
        foundFirst = true;
      } else {
        return candidate;
      }
    }

    candidate = addDays(candidate, 1);
  }

  return null;
}

// --------------------------------
// فحص تاريخ العامل
// --------------------------------

checkBtn.addEventListener("click", () => {
  try {
    const date = parseDate(todayDate.value);

    if (isNaN(date.getTime())) {
      alert("يرجى إدخال تاريخ صحيح.");
      return;
    }

    const work = isWorkDay(date);

    selectedDate.textContent = formatArabicDate(date);

    if (work) {
      statusBox.className = "status work";
      statusBox.textContent =
        date.getDay() === 4
          ? "🟢 اليوم يوم عمل — الخميس، وغدًا الجمعة أيضًا يوم عمل."
          : "🟢 اليوم يوم عمل.";
    } else {
      statusBox.className = "status off";
      statusBox.textContent = "🟡 اليوم إجازة.";
    }

    const next = getNextWorkDay(date);
    const following = getFollowingWorkDay(date);

    nextWork.textContent = next
      ? formatArabicDate(next)
      : "غير متاح";

    followingWork.textContent = following
      ? formatArabicDate(following)
      : "غير متاح";

    todayResult.classList.remove("hidden");

  } catch (error) {
    alert(error.message);
  }
});

// --------------------------------
// عرض أيام العمل خلال الشهر
// --------------------------------

monthBtn.addEventListener("click", () => {
  try {
    if (!monthPicker.value) {
      alert("يرجى اختيار الشهر.");
      return;
    }

    const [year, month] = monthPicker.value.split("-").map(Number);

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const schedule = buildScheduleUntil(lastDay);

    const datesInMonth = schedule.filter(date =>
      date >= firstDay && date <= lastDay
    );

    workDays.innerHTML = "";

    monthSummary.classList.remove("hidden");
    monthSummary.textContent =
      `عدد أيام العمل في ${month}/${year}: ${datesInMonth.length} يوم`;

    if (datesInMonth.length === 0) {
      workDays.innerHTML =
        `<div class="empty">لا توجد أيام عمل في هذا الشهر حسب تاريخ بداية الدورة.</div>`;
      return;
    }

    datesInMonth.forEach(date => {
      const card = document.createElement("div");
      card.className = "work-day";

      if (date.getDay() === 4) {
        card.classList.add("special");

        card.innerHTML = `
          <div class="date">${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}</div>
          <div class="weekday">الخميس</div>
          <span class="badge">الخميس + الجمعة عمل</span>
        `;
      } else {
        card.innerHTML = `
          <div class="date">${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}</div>
          <div class="weekday">${weekdayNames[date.getDay()]}</div>
        `;
      }

      workDays.appendChild(card);
    });

  } catch (error) {
    alert(error.message);
  }
});

// عرض بيانات اليوم تلقائيًا عند فتح الصفحة
checkBtn.click();
