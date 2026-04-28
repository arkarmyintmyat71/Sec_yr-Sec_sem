package com.furiousfive.PleasantCorner.controller;

import com.furiousfive.PleasantCorner.dto.OrderSummaryDto;
import com.furiousfive.PleasantCorner.dto.PaymentTransactionDto;
import com.furiousfive.PleasantCorner.dto.RejectRequest;
import com.furiousfive.PleasantCorner.model.StaffMember;
import com.furiousfive.PleasantCorner.repository.CafeTableRepository;
import com.furiousfive.PleasantCorner.repository.OrderRepository;
import com.furiousfive.PleasantCorner.repository.DiscountRepository;
import com.furiousfive.PleasantCorner.repository.DrinkStateRepository;
import com.furiousfive.PleasantCorner.repository.ToppingRepository;
import com.furiousfive.PleasantCorner.service.DashboardService;
import com.furiousfive.PleasantCorner.service.OrderService;
import com.furiousfive.PleasantCorner.service.QrCodeService;
import com.furiousfive.PleasantCorner.service.StaffMemberService;
import lombok.RequiredArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final DashboardService    dashboardService;
    private final OrderService        orderService;
    private final StaffMemberService  staffMemberService;
    private final ToppingRepository   toppingRepository;
    private final OrderRepository      orderRepository;
    private final DrinkStateRepository drinkStateRepository;
    private final CafeTableRepository  cafeTableRepository;
    private final DiscountRepository   discountRepository;
    private final QrCodeService        qrCodeService;

    // ── shared helper ────────────────────────────────────────────────────────
    private void common(Model model, Authentication auth, String activePage) {
        model.addAttribute("adminName",  auth != null ? auth.getName() : "Admin");
        model.addAttribute("activePage", activePage);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────
    @GetMapping("/dashboard")
    public String dashboard(Model model, Authentication auth) {
        common(model, auth, "dashboard");
        model.addAttribute("activeOrders",  dashboardService.countActiveOrders());
        model.addAttribute("todayOrders",   dashboardService.countTodayOrders());
        model.addAttribute("todayRevenue",  dashboardService.todayRevenue());
        model.addAttribute("currentOrders", orderService.findActiveOrders().stream().map(OrderSummaryDto::from).collect(Collectors.toList()));
        return "admin/dashboard";
    }

    // ── Orders ────────────────────────────────────────────────────────────────
    @GetMapping("/current-orders")
    public String currentOrders(Model model, Authentication auth) {
        common(model, auth, "current-orders");
        model.addAttribute("orders", orderService.findActiveOrders().stream().map(OrderSummaryDto::from).collect(Collectors.toList()));
        return "admin/current_orders";
    }

    @GetMapping("/order-history")
    public String orderHistory(Model model, Authentication auth) {
        common(model, auth, "order-history");
        model.addAttribute("orders", orderService.findOrderHistory().stream().map(OrderSummaryDto::from).collect(Collectors.toList()));
        return "admin/order_history";
    }

    // ── Menu Items ────────────────────────────────────────────────────────────
    @GetMapping("/menu-items")
    public String menuItems(Model model, Authentication auth) {
        common(model, auth, "menu-items");
        return "admin/menu_items";
    }

    // ── Toppings ──────────────────────────────────────────────────────────────
    @GetMapping("/toppings")
    public String toppings(Model model, Authentication auth) {
        common(model, auth, "toppings");
        model.addAttribute("toppingList", toppingRepository.findAll());
        return "admin/toppings";
    }

    // ── Drink States ──────────────────────────────────────────────────────────
    @GetMapping("/drink-states")
    public String drinkStates(Model model, Authentication auth) {
        common(model, auth, "drink-states");
        model.addAttribute("drinkStateList", drinkStateRepository.findAll());
        return "admin/drink_states";
    }

    // ── Tables & QR ───────────────────────────────────────────────────────────
    @GetMapping("/tables-qr")
    public String tablesQr(Model model, Authentication auth) {
        common(model, auth, "tables-qr");
        model.addAttribute("tableList", cafeTableRepository.findAll());
        return "admin/tables_qr";
    }

    // ── Payments ──────────────────────────────────────────────────────────────
    @GetMapping("/payments")
    public String payments(Model model, Authentication auth) {
        common(model, auth, "payments");
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end   = start.plusDays(1);
        // Revenue stats
        model.addAttribute("todayCashRevenue",  dashboardService.todayCashRevenue());
        model.addAttribute("todayQrRevenue",    dashboardService.todayQrRevenue());
        model.addAttribute("todayCashCount",    dashboardService.countTodayByMethod("Cash"));
        model.addAttribute("todayQrCount",      dashboardService.countTodayByMethod("QR"));
        // Today's completed transactions for the table
        model.addAttribute("transactions",
            orderRepository.findCompletedBetween(start, end).stream()
                .map(PaymentTransactionDto::from)
                .collect(Collectors.toList())
        );
        // Load the currently saved payment QR so it shows on page load
        String savedQr = cafeTableRepository.findAll().stream()
            .map(com.furiousfive.PleasantCorner.model.CafeTable::getPaymentQrDataUrl)
            .filter(q -> q != null && !q.isBlank())
            .findFirst().orElse("");
        model.addAttribute("savedPaymentQr", savedQr);
        return "admin/payments";
    }

    // ── Discounts ─────────────────────────────────────────────────────────────
    @GetMapping("/discounts")
    public String discounts(Model model, Authentication auth) {
        common(model, auth, "discounts");
        model.addAttribute("discountList", discountRepository.findAll());
        return "admin/discounts";
    }

    // ── Staff List ─────────────────────────────────────────────────────────────
    @GetMapping("/staff")
    public String staff(Model model, Authentication auth) {
        common(model, auth, "staff");
        model.addAttribute("staffList", staffMemberService.findAll());
        return "admin/staff";
    }

    @GetMapping("/staff/add")
    public String addStaff(Model model, Authentication auth) {
        common(model, auth, "staff");
        model.addAttribute("staff", new StaffMember());
        model.addAttribute("isEdit", false);
        return "admin/staff_form";
    }

    @PostMapping("/staff/add")
    public String saveStaff(@ModelAttribute("staff") StaffMember staff) {
        staffMemberService.save(staff);
        return "redirect:/admin/staff";
    }

    @GetMapping("/staff/edit/{id}")
    public String editStaff(@PathVariable Long id, Model model, Authentication auth) {
        common(model, auth, "staff");
        model.addAttribute("staff", staffMemberService.findById(id));
        model.addAttribute("isEdit", true);
        return "admin/staff_form";
    }

    @PostMapping("/staff/update")
    public String updateStaff(@ModelAttribute StaffMember staff) {
        staffMemberService.updateStaff(staff);
        return "redirect:/admin/staff";
    }

    @PutMapping("/staff/{id}/approve")
    @ResponseBody
    public ResponseEntity<?> approveStaff(@PathVariable Long id) {
        staffMemberService.updateStatus(id, "approved", null);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/staff/{id}/reject")
    @ResponseBody
    public ResponseEntity<?> rejectStaff(@PathVariable Long id,
                                          @RequestBody RejectRequest request) {
        staffMemberService.updateStatus(id, "rejected", request.getNotes());
        return ResponseEntity.ok().build();
    }

    // ── Settings ──────────────────────────────────────────────────────────────
    @GetMapping("/settings")
    public String settings(Model model, Authentication auth) {
        common(model, auth, "settings");
        model.addAttribute("ngrokBaseUrl", qrCodeService.getNgrokBaseUrl()
            .replace("http://localhost:8001", ""));
        return "admin/settings";
    }
}
