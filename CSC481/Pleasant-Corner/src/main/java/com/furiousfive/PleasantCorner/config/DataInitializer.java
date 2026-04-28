package com.furiousfive.PleasantCorner.config;

import com.furiousfive.PleasantCorner.enums.Category;
import com.furiousfive.PleasantCorner.enums.ItemType;
import com.furiousfive.PleasantCorner.model.*;
import com.furiousfive.PleasantCorner.service.QrCodeService;
import com.furiousfive.PleasantCorner.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final MenuItemRepository   menuItemRepository;
    private final ToppingRepository    toppingRepository;
    private final DrinkStateRepository drinkStateRepository;
    private final CafeTableRepository  cafeTableRepository;
    private final OrderRepository      orderRepository;
    private final DiscountRepository   discountRepository;
    private final StaffMemberRepository staffMemberRepository;
    private final QrCodeService          qrCodeService;

    @Override
    public void run(String... args) {

        // ── Drink States ────────────────────────────────────────────────────
        if (drinkStateRepository.count() == 0) {
            drinkStateRepository.saveAll(List.of(
                DrinkState.builder().name("Hot").priceAdjustment(BigDecimal.ZERO).defaultState(true).emoji("🔥").description("Served hot").build(),
                DrinkState.builder().name("Iced").priceAdjustment(BigDecimal.ZERO).defaultState(false).emoji("🧊").description("Served cold").build(),
                DrinkState.builder().name("Warm").priceAdjustment(BigDecimal.ZERO).defaultState(false).emoji("☕").description("Room temperature").build()
            ));
            log.info("Seeded drink states");
        }

        // ── Toppings ────────────────────────────────────────────────────────
        if (toppingRepository.count() == 0) {
            toppingRepository.saveAll(List.of(
                Topping.builder().name("Whipped Cream").priceAdjustment(new BigDecimal("15")).status("available").emoji("🍥").description("Fresh dairy whip").build(),
                Topping.builder().name("Pearl (Boba)").priceAdjustment(new BigDecimal("10")).status("available").emoji("🧋").description("Chewy tapioca pearls").build(),
                Topping.builder().name("Brown Sugar Syrup").priceAdjustment(new BigDecimal("10")).status("available").emoji("🍯").description("House-made brown sugar syrup").build(),
                Topping.builder().name("Fresh Strawberry").priceAdjustment(new BigDecimal("20")).status("available").emoji("🍓").description("Seasonal fresh strawberries").build(),
                Topping.builder().name("Cinnamon Powder").priceAdjustment(BigDecimal.ZERO).status("available").emoji("✨").description("Aromatic cinnamon dust").build(),
                Topping.builder().name("Marshmallow").priceAdjustment(new BigDecimal("10")).status("available").emoji("☁️").description("Toasted mini marshmallows").build()
            ));
            log.info("Seeded toppings");
        }

        // ── Menu Items ──────────────────────────────────────────────────────
        if (menuItemRepository.count() == 0) {
            menuItemRepository.saveAll(List.of(
                MenuItem.builder().itemName("Caramel Latte").category(Category.COFFEE).itemType(ItemType.DRINK)
                    .description("Rich espresso with house caramel and steamed milk.").price(new BigDecimal("180"))
                    .emojiIcon("☕").available(true).featuredItem(true).build(),
                MenuItem.builder().itemName("Matcha Latte").category(Category.COFFEE).itemType(ItemType.DRINK)
                    .description("Ceremonial matcha whisked into silky steamed milk.").price(new BigDecimal("190"))
                    .emojiIcon("🍵").available(true).featuredItem(false).build(),
                MenuItem.builder().itemName("Espresso").category(Category.COFFEE).itemType(ItemType.DRINK)
                    .description("Double-shot single-origin espresso.").price(new BigDecimal("90"))
                    .emojiIcon("☕").available(true).featuredItem(false).build(),
                MenuItem.builder().itemName("Cold Brew").category(Category.COFFEE).itemType(ItemType.DRINK)
                    .description("12-hour cold-steeped coffee, smooth and bold.").price(new BigDecimal("160"))
                    .emojiIcon("🧊").available(true).featuredItem(false).build(),
                MenuItem.builder().itemName("Avocado Toast").category(Category.FOOD).itemType(ItemType.FOOD)
                    .description("Sourdough with smashed avocado, poached egg and chilli flakes.").price(new BigDecimal("220"))
                    .emojiIcon("🥑").available(true).featuredItem(true).build(),
                MenuItem.builder().itemName("Club Sandwich").category(Category.FOOD).itemType(ItemType.FOOD)
                    .description("Triple-decker with chicken, bacon, lettuce and tomato.").price(new BigDecimal("195"))
                    .emojiIcon("🥪").available(true).featuredItem(false).build(),
                MenuItem.builder().itemName("Croissant").category(Category.FOOD).itemType(ItemType.FOOD)
                    .description("Buttery all-butter croissant, baked fresh daily.").price(new BigDecimal("85"))
                    .emojiIcon("🥐").available(true).featuredItem(false).build(),
                MenuItem.builder().itemName("Chocolate Cake").category(Category.DESSERT).itemType(ItemType.FOOD)
                    .description("Moist dark chocolate cake with ganache frosting.").price(new BigDecimal("150"))
                    .emojiIcon("🍰").available(true).featuredItem(false).build(),
                MenuItem.builder().itemName("Cheesecake").category(Category.DESSERT).itemType(ItemType.FOOD)
                    .description("New York-style baked cheesecake with berry compote.").price(new BigDecimal("160"))
                    .emojiIcon("🫐").available(true).featuredItem(false).build(),
                MenuItem.builder().itemName("Blueberry Muffin").category(Category.DESSERT).itemType(ItemType.FOOD)
                    .description("Fluffy muffin packed with fresh blueberries.").price(new BigDecimal("120"))
                    .emojiIcon("🧁").available(false).featuredItem(false).build()
            ));
            log.info("Seeded menu items");
        }

        // ── Cafe Tables ─────────────────────────────────────────────────────
        if (cafeTableRepository.count() == 0) {
            for (int i = 1; i <= 12; i++) {
                String customerUrl  = qrCodeService.buildCustomerUrl(i);
                String qrDataUrl    = qrCodeService.generateQrDataUrl(customerUrl);
                cafeTableRepository.save(
                    CafeTable.builder()
                        .tableNumber(i)
                        .seats(i <= 8 ? 2 : 4)
                        .locationNote(i <= 4 ? "Window seat" : i <= 8 ? "Indoor" : "Outdoor")
                        .status("active")
                        .customerUrl(customerUrl)
                        .tableQrDataUrl(qrDataUrl)
                        .build()
                );
            }
            log.info("Seeded 12 cafe tables with QR codes");
        } else {
            // Regenerate QR for tables that don't have one yet
            cafeTableRepository.findAll().forEach(t -> {
                if (t.getTableQrDataUrl() == null || t.getTableQrDataUrl().isBlank()) {
                    String url = qrCodeService.buildCustomerUrl(t.getTableNumber());
                    t.setCustomerUrl(url);
                    t.setTableQrDataUrl(qrCodeService.generateQrDataUrl(url));
                    cafeTableRepository.save(t);
                }
            });
        }

        // ── Sample Orders ───────────────────────────────────────────────────
        if (orderRepository.count() == 0) {
            List<CafeTable> tables = cafeTableRepository.findAll();
            CafeTable t7 = tables.get(6);
            CafeTable t3 = tables.get(2);
            CafeTable t5 = tables.get(4);

            Order o1 = orderRepository.save(Order.builder()
                .queueNumber(15).table(t7).status("pending")
                .total(new BigDecimal("225")).paymentMethod("Cash")
                .createdAt(LocalDateTime.now().minusMinutes(12))
                .build());

            Order o2 = orderRepository.save(Order.builder()
                .queueNumber(16).table(t3).status("preparing")
                .total(new BigDecimal("215")).paymentMethod("QR")
                .createdAt(LocalDateTime.now().minusMinutes(8))
                .build());

            Order o3 = orderRepository.save(Order.builder()
                .queueNumber(17).table(t5).status("ready")
                .total(new BigDecimal("225")).paymentMethod("Cash")
                .createdAt(LocalDateTime.now().minusMinutes(20))
                .build());

            // Two completed/historical orders
            orderRepository.save(Order.builder()
                .queueNumber(13).table(t7).status("completed")
                .total(new BigDecimal("140")).paymentMethod("Cash")
                .createdAt(LocalDateTime.now().minusHours(2))
                .completedAt(LocalDateTime.now().minusHours(1))
                .build());

            orderRepository.save(Order.builder()
                .queueNumber(14).table(t3).status("cancelled")
                .total(new BigDecimal("90")).paymentMethod("Cash")
                .createdAt(LocalDateTime.now().minusHours(3))
                .completedAt(LocalDateTime.now().minusHours(3).plusMinutes(10))
                .build());

            log.info("Seeded sample orders");
        }

        // ── Discounts ───────────────────────────────────────────────────────
        if (discountRepository.count() == 0) {
            discountRepository.saveAll(List.of(
                Discount.builder().code("HAPPY10").name("Happy Hour Discount").discountType("percent").value(new BigDecimal("10"))
                    .startDate(LocalDate.now().minusDays(30)).endDate(LocalDate.now().plusDays(30))
                    .description("10% off any order. Most popular promo this month!").status("active").build(),
                Discount.builder().code("WELCOME50").name("New Customer Special").discountType("fixed").value(new BigDecimal("50"))
                    .startDate(LocalDate.now()).endDate(LocalDate.now().plusDays(7))
                    .description("฿50 off for new customers.").status("active").build(),
                Discount.builder().code("BOGO").name("Buy 2 Get 1 Free").discountType("bogo").value(new BigDecimal("1"))
                    .startDate(LocalDate.now().plusDays(5)).endDate(LocalDate.now().plusDays(15))
                    .description("Buy 2 drinks, get 1 free on weekends.").status("scheduled").build()
            ));
            log.info("Seeded discounts");
        }

        // ── Staff Members ───────────────────────────────────────────────────
        if (staffMemberRepository.count() == 0) {
            staffMemberRepository.saveAll(List.of(
                StaffMember.builder().fullName("Nattaya Srisuk").email("nattaya@cafe.com")
                    .phone("081-234-5678").role("Barista").status("approved")
                    .registeredDate(LocalDate.now().minusMonths(3))
                    .experience("2 years barista experience").availability("Mon–Fri 08:00–17:00")
                    .monthlySalary(new BigDecimal("18000")).build(),
                StaffMember.builder().fullName("Krit Phanupong").email("krit@cafe.com")
                    .phone("089-876-5432").role("Cashier").status("pending")
                    .registeredDate(LocalDate.now().minusDays(3))
                    .experience("1 year retail cashier").availability("Flexible")
                    .build(),
                StaffMember.builder().fullName("Ploy Wattana").email("ploy@cafe.com")
                    .phone("062-111-9999").role("Barista").status("rejected")
                    .registeredDate(LocalDate.now().minusMonths(1))
                    .experience("No prior experience").availability("Weekends only")
                    .notes("Position filled at time of application").build()
            ));
            log.info("Seeded staff members");
        }
    }
}
