import { expect, test } from "@playwright/test";

test("landing page lists 9 city routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /choose a city/i })).toBeVisible();
  await expect(page.locator('a[href^="/city/"]')).toHaveCount(9);
});

test("Tokyo calculator updates on tier change", async ({ page }) => {
  await page.goto("/city/tokyo");
  await expect(page.getByText("Fat FIRE target")).toBeVisible();
  const initial = await page.getByTestId("fire-target-value").textContent();
  expect(initial).toMatch(/\$\d/);

  await page.getByLabel("Tier").selectOption("true_fat_fire");
  const updated = await page.getByTestId("fire-target-value").textContent();
  expect(updated).not.toBe(initial);
});

test("rent to own shows the home add-back line", async ({ page }) => {
  await page.goto("/city/tokyo");
  await page.getByLabel("Mode").selectOption("own");
  await expect(page.getByTestId("home-addback")).toBeVisible();
});

test("URL query param restores state", async ({ page }) => {
  await page.goto("/city/tokyo");
  await page.getByLabel("Tier").selectOption("true_fat_fire");
  await page.getByLabel("US retirement state").selectOption("CA");

  const url = page.url();
  expect(url).toContain("q=");

  await page.goto(url);
  await expect(page.getByLabel("Tier")).toHaveValue("true_fat_fire");
  await expect(page.getByLabel("US retirement state")).toHaveValue("CA");
});

test("comparison page renders multiple city rows", async ({ page }) => {
  await page.goto("/compare?cities=tokyo,kuala-lumpur,san-francisco");
  await expect(page.getByRole("heading", { name: /compare city targets/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tokyo" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Kuala Lumpur" })).toBeVisible();
  await expect(page.getByRole("link", { name: "San Francisco" })).toBeVisible();
});
