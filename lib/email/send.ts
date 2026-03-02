import nodemailer from "nodemailer";
import { env } from "@/lib/env";
import type { MealPlanJson } from "@/lib/plan/schema";

function buildEmailHtml(plan: MealPlanJson, planUrl: string) {
  const daysHtml = plan.days
    .map((day) => {
      const meals = day.meals
        .map(
          (meal) => `
            <li>
              <strong>${meal.name}</strong> (${meal.timeMinutes} min)
              <ul>${meal.recipe.ingredients.map((i) => `<li>${i.quantity} ${i.unit} ${i.name}</li>`).join("")}</ul>
            </li>
          `
        )
        .join("");
      return `<h3>${day.date}</h3><ul>${meals}</ul>`;
    })
    .join("");

  const groceryHtml = plan.groceryList
    .map(
      (store) => `<h3>${store.store}</h3><ul>${store.items
        .map((item) => `<li>${item.name} - ${item.quantity} ${item.unit}${item.isOffer ? " (Offer)" : ""}</li>`)
        .join("")}</ul>`
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h1>Weekly Meal Plan</h1>
      <p>Week start: ${plan.weekStart} | Household: ${plan.peopleCount} people</p>
      ${daysHtml}
      <h2>Grocery List</h2>
      ${groceryHtml}
      <h2>Waste and Reuse</h2>
      <ul>${plan.wasteNotes.map((note) => `<li>${note}</li>`).join("")}</ul>
      <p><a href="${planUrl}">Open full plan in app</a></p>
    </div>
  `;
}

function buildEmailText(plan: MealPlanJson, planUrl: string) {
  const lines: string[] = [];
  lines.push(`Weekly Meal Plan - ${plan.weekStart}`);
  lines.push(`People: ${plan.peopleCount}`);
  lines.push("");
  for (const day of plan.days) {
    lines.push(day.date);
    for (const meal of day.meals) {
      lines.push(`- ${meal.name} (${meal.timeMinutes} min)`);
      for (const ingredient of meal.recipe.ingredients) {
        lines.push(`  * ${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`);
      }
    }
    lines.push("");
  }

  lines.push("Grocery List");
  for (const group of plan.groceryList) {
    lines.push(group.store);
    for (const item of group.items) {
      lines.push(`- ${item.name}: ${item.quantity} ${item.unit}${item.isOffer ? " [offer]" : ""}`);
    }
  }

  lines.push("");
  lines.push("Waste Notes:");
  for (const note of plan.wasteNotes) {
    lines.push(`- ${note}`);
  }
  lines.push(`Plan URL: ${planUrl}`);

  return lines.join("\n");
}

async function sendViaSendGrid(to: string, subject: string, html: string, text: string) {
  if (!env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY missing");
  }

  const response = await fetch(env.SENDGRID_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: env.MAIL_FROM },
      subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SendGrid failed: ${body}`);
  }
}

async function sendViaSmtp(to: string, subject: string, html: string, text: string) {
  if (!env.SMTP_HOST) {
    throw new Error("SMTP_HOST missing");
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
  });

  await transport.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    html,
    text
  });
}

export async function sendMealPlanEmail(params: {
  to: string;
  plan: MealPlanJson;
  shareToken: string;
}) {
  const { to, plan, shareToken } = params;
  const subject = `Meal plan for week of ${plan.weekStart}`;
  const planUrl = `${env.APP_BASE_URL}/results/${shareToken}`;
  const html = buildEmailHtml(plan, planUrl);
  const text = buildEmailText(plan, planUrl);

  if (env.SENDGRID_API_KEY) {
    await sendViaSendGrid(to, subject, html, text);
    return;
  }

  await sendViaSmtp(to, subject, html, text);
}

