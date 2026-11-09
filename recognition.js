/* ==========================================================================
   Happy Minds — student recognition (used by the classroom app and the
   student portal)
   - Fix It Zone streak: days in a row with Fix It work, from the student's
     own activity history (studentPortal.history, icon 🛠).
   - Month activity: Fix It boxes, practice sets and stories in one month,
     plus the days the student was active. Used to suggest the Class Star
     of the Month; the class teacher or trainer makes the final choice.
   - Class Star of the Month: saved in the class's classProgress record as
     stars["YYYY-MM"] = { studentId, name, by, at }.
   Days follow Indian time, like the rest of the portal.
   ========================================================================== */

const HMRecognition = (() => {
    const dayOf = value => new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const today = () => dayOf(Date.now());
    const monthKey = (value = Date.now()) => dayOf(value).slice(0, 7);
    const addDays = (iso, n) => {
        const d = new Date(`${iso}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() + n);
        return d.toISOString().slice(0, 10);
    };

    // "Aanya Krishnan" -> "Aanya K."; "Arjun" stays "Arjun".
    function shortName(full) {
        const parts = String(full || '').trim().split(/\s+/);
        return parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.` : parts[0] || '';
    }

    const historyDays = (portal, icon) => new Set(((portal && portal.history) || [])
        .filter(h => h && h.date && (!icon || h.icon === icon)).map(h => dayOf(h.date)));

    // Days in a row with Fix It work, ending today or yesterday (0 otherwise).
    function fixItStreak(portal) {
        const days = historyDays(portal, '🛠');
        let day = today();
        if (!days.has(day)) day = addDays(day, -1);
        let streak = 0;
        while (days.has(day)) { streak += 1; day = addDays(day, -1); }
        return streak;
    }

    // What one student did in a month ("YYYY-MM"). `stories` are that
    // student's story_submissions rows (optional).
    function monthActivity(portal, stories, month = monthKey()) {
        const inMonth = h => h && h.date && dayOf(h.date).slice(0, 7) === month;
        const history = ((portal && portal.history) || []).filter(inMonth);
        const fixit = history.filter(h => h.icon === '🛠').length;
        const practice = history.filter(h => h.icon === '🧩').length;
        const storyCount = (stories || []).filter(s => s.created_at && dayOf(s.created_at).slice(0, 7) === month).length;
        const days = new Set(history.map(h => dayOf(h.date))).size;
        // Simple, explainable weighting: finished work counts most.
        const score = fixit * 2 + practice * 3 + storyCount * 3 + days;
        return { fixit, practice, stories: storyCount, days, score };
    }

    function describe(activity) {
        const parts = [];
        if (activity.fixit) parts.push(`${activity.fixit} Fix It ${activity.fixit === 1 ? 'box' : 'boxes'}`);
        if (activity.practice) parts.push(`${activity.practice} practice ${activity.practice === 1 ? 'set' : 'sets'}`);
        if (activity.stories) parts.push(`${activity.stories} ${activity.stories === 1 ? 'story' : 'stories'}`);
        if (activity.days) parts.push(`active ${activity.days} ${activity.days === 1 ? 'day' : 'days'}`);
        return parts.join(' · ') || 'No portal activity yet this month';
    }

    function starOf(classProgress, month = monthKey()) {
        return (classProgress && classProgress.stars && classProgress.stars[month]) || null;
    }

    const monthName = month => new Date(`${month}-15T12:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    return { dayOf, today, monthKey, shortName, fixItStreak, monthActivity, describe, starOf, monthName };
})();
