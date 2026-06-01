from __future__ import annotations

from copy import deepcopy
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
from xml.etree import ElementTree as ET


W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NSMAP = {
    "w": W_NS,
    "r": R_NS,
}


def qn(ns: str, tag: str) -> str:
    return f"{{{ns}}}{tag}"


def w(tag: str) -> str:
    return qn(W_NS, tag)


def make_rpr(size: int = 28, bold: bool = False, italic: bool = False, caps: bool = False) -> ET.Element:
    rpr = ET.Element(w("rPr"))
    rfonts = ET.SubElement(rpr, w("rFonts"))
    for key in ("ascii", "hAnsi", "cs", "eastAsia"):
        rfonts.set(w(key), "Times New Roman")
    if bold:
        ET.SubElement(rpr, w("b"))
        ET.SubElement(rpr, w("bCs"))
    if italic:
        ET.SubElement(rpr, w("i"))
        ET.SubElement(rpr, w("iCs"))
    if caps:
        ET.SubElement(rpr, w("caps"))
    sz = ET.SubElement(rpr, w("sz"))
    sz.set(w("val"), str(size))
    sz_cs = ET.SubElement(rpr, w("szCs"))
    sz_cs.set(w("val"), str(size))
    return rpr


def make_ppr(
    *,
    align: str = "both",
    first_line: int = 709,
    before: int = 0,
    after: int = 0,
    line: int = 360,
    page_break_before: bool = False,
) -> ET.Element:
    ppr = ET.Element(w("pPr"))
    spacing = ET.SubElement(ppr, w("spacing"))
    spacing.set(w("before"), str(before))
    spacing.set(w("after"), str(after))
    spacing.set(w("line"), str(line))
    spacing.set(w("lineRule"), "auto")
    ind = ET.SubElement(ppr, w("ind"))
    ind.set(w("firstLine"), str(first_line))
    jc = ET.SubElement(ppr, w("jc"))
    jc.set(w("val"), align)
    if page_break_before:
        ET.SubElement(ppr, w("pageBreakBefore"))
    return ppr


def paragraph(
    text: str,
    *,
    size: int = 28,
    align: str = "both",
    first_line: int = 709,
    before: int = 0,
    after: int = 0,
    line: int = 360,
    bold: bool = False,
    italic: bool = False,
    caps: bool = False,
    page_break_before: bool = False,
) -> ET.Element:
    p = ET.Element(w("p"))
    p.append(
        make_ppr(
            align=align,
            first_line=first_line,
            before=before,
            after=after,
            line=line,
            page_break_before=page_break_before,
        )
    )
    r = ET.SubElement(p, w("r"))
    r.append(make_rpr(size=size, bold=bold, italic=italic, caps=caps))
    t = ET.SubElement(r, w("t"))
    if text.startswith(" ") or text.endswith(" "):
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    t.text = text
    return p


def multi_paragraph_cell(lines: list[str], *, header: bool = False) -> ET.Element:
    tc = ET.Element(w("tc"))
    tc_pr = ET.SubElement(tc, w("tcPr"))
    tcw = ET.SubElement(tc_pr, w("tcW"))
    tcw.set(w("w"), "0")
    tcw.set(w("type"), "auto")
    for idx, line in enumerate(lines):
        tc.append(
            paragraph(
                line,
                size=24,
                align="center" if header else "left",
                first_line=0,
                before=0,
                after=0,
                line=240,
                bold=header,
            )
        )
    return tc


def table(rows: list[list[str]], widths: list[int]) -> ET.Element:
    tbl = ET.Element(w("tbl"))
    tbl_pr = ET.SubElement(tbl, w("tblPr"))
    style = ET.SubElement(tbl_pr, w("tblStyle"))
    style.set(w("val"), "TableGrid")
    tbl_w = ET.SubElement(tbl_pr, w("tblW"))
    tbl_w.set(w("w"), str(sum(widths)))
    tbl_w.set(w("type"), "dxa")
    layout = ET.SubElement(tbl_pr, w("tblLayout"))
    layout.set(w("type"), "fixed")

    borders = ET.SubElement(tbl_pr, w("tblBorders"))
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        node = ET.SubElement(borders, w(edge))
        node.set(w("val"), "single")
        node.set(w("sz"), "8")
        node.set(w("space"), "0")
        node.set(w("color"), "000000")

    tbl_grid = ET.SubElement(tbl, w("tblGrid"))
    for width in widths:
        col = ET.SubElement(tbl_grid, w("gridCol"))
        col.set(w("w"), str(width))

    for row_index, row in enumerate(rows):
        tr = ET.SubElement(tbl, w("tr"))
        for col_index, value in enumerate(row):
            tc = ET.SubElement(tr, w("tc"))
            tc_pr = ET.SubElement(tc, w("tcPr"))
            tc_w = ET.SubElement(tc_pr, w("tcW"))
            tc_w.set(w("w"), str(widths[col_index]))
            tc_w.set(w("type"), "dxa")
            tc.append(
                paragraph(
                    value,
                    size=24,
                    align="center" if row_index == 0 else "left",
                    first_line=0,
                    before=0,
                    after=0,
                    line=240,
                    bold=(row_index == 0),
                )
            )
    return tbl


def page_break_paragraph() -> ET.Element:
    p = ET.Element(w("p"))
    r = ET.SubElement(p, w("r"))
    br = ET.SubElement(r, w("br"))
    br.set(w("type"), "page")
    return p


def build_document(sect_pr: ET.Element) -> ET.Element:
    ET.register_namespace("w", W_NS)
    ET.register_namespace("r", R_NS)

    doc = ET.Element(w("document"))
    body = ET.SubElement(doc, w("body"))

    tools_rows = [
        ["Инструмент", "Назначение", "Обоснование выбора"],
        ["Node.js fetch + HTTP-запросы", "Интеграционная проверка backend API", "Позволяет быстро проверить реальные REST-маршруты без изменения исходного кода приложения"],
        ["ts-node-dev", "Запуск backend в режиме разработки", "Обеспечивает оперативный запуск сервера для проведения проверок"],
        ["npm run build", "Проверка собираемости backend и frontend", "Подтверждает корректность TypeScript-кода и готовность проекта к сборке"],
        ["SQLite / Prisma", "Хранение и проверка тестовых данных", "Используются приложением по умолчанию, поэтому тестирование проводилось в нативном для проекта окружении"],
        ["Vitest, Supertest, Testing Library, Playwright", "Последующая автоматизация на TypeScript", "Наиболее подходит для unit, integration и e2e-тестов в проектах на Node.js, React и Next.js"],
    ]

    env_rows = [
        ["Параметр", "Значение"],
        ["Дата проведения проверки", "17.05.2026"],
        ["Проект", "finance-planner"],
        ["Backend", "Express.js, Prisma, SQLite"],
        ["Frontend", "Next.js 14, TypeScript, Material UI, Recharts"],
        ["Адрес тестируемого API", "http://127.0.0.1:4000"],
        ["База данных", "backend/prisma/dev.db"],
        ["Особенности окружения", "Во время frontend-сборки были предупреждения о недоступности Google Fonts в офлайновой среде; сборка при этом завершилась успешно"],
    ]

    test_case_rows = [
        ["№", "Название тестового сценария", "Предусловия", "Шаги", "Ожидаемый результат"],
        ["1", "Регистрация нового пользователя (позитивный)", "Пользователь с указанным email отсутствует в системе", "1. Отправить POST /api/auth/register с корректными email, name, password. 2. Получить ответ сервера.", "Возвращается код 201, JWT-токен и объект созданного пользователя"],
        ["2", "Регистрация с существующим email (негативный)", "В системе уже есть пользователь с таким email", "1. Повторно отправить POST /api/auth/register с тем же email.", "Возвращается код 400 и сообщение о дублировании пользователя"],
        ["3", "Успешная авторизация", "Пользователь зарегистрирован", "1. Отправить POST /api/auth/login с корректными данными. 2. Получить ответ.", "Возвращается код 200, JWT-токен и данные пользователя"],
        ["4", "Доступ к защищенному ресурсу без токена", "Пользователь неавторизован", "1. Отправить GET /api/auth/me без заголовка Authorization.", "Возвращается код 401 и сообщение о том, что токен не предоставлен"],
        ["5", "Автосоздание стандартных категорий после регистрации", "Выполнен успешный сценарий регистрации", "1. Выполнить GET /api/categories с токеном нового пользователя.", "Система возвращает 10 стандартных категорий"],
        ["6", "Создание новой категории", "Пользователь авторизован", "1. Отправить POST /api/categories с названием новой категории и иконкой.", "Категория создается, возвращается код 201"],
        ["7", "Установка лимита категории", "Категория существует и принадлежит пользователю", "1. Отправить PUT /api/categories/:id/limit со значением лимита.", "Лимит сохраняется, возвращается обновленная категория"],
        ["8", "Создание доходной операции", "Пользователь авторизован, категория существует", "1. Отправить POST /api/transactions с типом income и корректными данными.", "Операция создается, возвращается код 201"],
        ["9", "Создание расходной операции", "Пользователь авторизован, категория существует", "1. Отправить POST /api/transactions с типом expense и корректными данными.", "Операция создается, возвращается код 201"],
        ["10", "Валидация отрицательной суммы операции", "Пользователь авторизован", "1. Отправить POST /api/transactions с отрицательной суммой.", "Возвращается код 400, операция не создается"],
        ["11", "Проверка расчета баланса", "В системе существуют доходная и расходная операции пользователя", "1. Выполнить GET /api/transactions/balance.", "Баланс равен разности суммы доходов и суммы расходов"],
        ["12", "Проверка аналитики и контроля лимитов", "Для категории установлен лимит и создан расход выше лимита", "1. Выполнить GET /api/analytics/expenses-by-category?period=month. 2. Выполнить GET /api/analytics/limits-status.", "Категория присутствует в аналитике, лимит определяется как превышенный"],
    ]

    checklist_rows = [
        ["№", "Наименование тестового случая", "Действия / входные данные", "Ожидаемый результат", "Фактический результат", "Примечание"],
        ["1", "Health check", "GET /api/health", "Статус 200, status=ok", "Пройдено", "Время ответа 38 мс"],
        ["2", "Защищенный маршрут без токена", "GET /api/auth/me без Authorization", "Статус 401", "Пройдено", "Сообщение: «Токен авторизации не предоставлен», 5 мс"],
        ["3", "Регистрация нового пользователя", "POST /api/auth/register с корректными данными", "Статус 201, токен и пользователь", "Пройдено", "Время ответа 121 мс"],
        ["4", "Повторная регистрация того же email", "POST /api/auth/register с уже существующим email", "Статус 400", "Пройдено", "Сообщение о дублировании, 2 мс"],
        ["5", "Вход с неверным паролем", "POST /api/auth/login с ошибочным паролем", "Статус 401", "Пройдено", "65 мс"],
        ["6", "Успешный вход", "POST /api/auth/login с корректными данными", "Статус 200, токен", "Пройдено", "63 мс"],
        ["7", "Получение профиля пользователя", "GET /api/auth/me с валидным токеном", "Статус 200, корректный email", "Пройдено", "2 мс"],
        ["8", "Автосоздание стандартных категорий", "GET /api/categories после регистрации", "10 категорий", "Пройдено", "Получено 10 категорий, 2 мс"],
        ["9", "Создание категории", "POST /api/categories, Инвестиции", "Статус 201", "Пройдено", "Создана категория id=41, 5 мс"],
        ["10", "Дублирующаяся категория", "POST /api/categories с тем же именем", "Статус 400", "Пройдено", "2 мс"],
        ["11", "Редактирование категории", "PUT /api/categories/41", "Название и иконка обновлены", "Пройдено", "Новое имя: Инвестиции и накопления, 3 мс"],
        ["12", "Установка лимита", "PUT /api/categories/41/limit, 5000", "Лимит сохранен", "Пройдено", "Лимит: 5000, 2 мс"],
        ["13", "Создание доходной операции", "POST /api/transactions, доход 100000", "Статус 201", "Пройдено", "Создана операция id=7, 4 мс"],
        ["14", "Создание расходной операции", "POST /api/transactions, расход 6200", "Статус 201", "Пройдено", "Создана операция id=8, 2 мс"],
        ["15", "Валидация отрицательной суммы", "POST /api/transactions, amount=-5", "Статус 400", "Пройдено", "Сообщение: «Сумма должна быть положительной», 2 мс"],
        ["16", "Фильтрация операций по типу", "GET /api/transactions?type=expense&page=1&limit=20", "Возвращаются только расходы", "Пройдено", "Найдена 1 операция, 2 мс"],
        ["17", "Редактирование операции", "PUT /api/transactions/8, сумма 7000", "Операция обновлена", "Пройдено", "Сумма изменена до 7000, 3 мс"],
        ["18", "Расчет баланса", "GET /api/transactions/balance", "Доход 100000, расход 7000, баланс 93000", "Пройдено", "1 мс"],
        ["19", "Аналитика расходов по категориям", "GET /api/analytics/expenses-by-category?period=month", "Категория присутствует в сводке", "Пройдено", "Возвращен 1 элемент, 2 мс"],
        ["20", "Динамика доходов/расходов", "GET /api/analytics/income-expense-trend?months=6", "6 точек графика", "Пройдено", "Получено 6 записей, 2 мс"],
        ["21", "Контроль превышения лимита", "GET /api/analytics/limits-status", "Лимит отмечен как превышенный", "Пройдено", "140%, remaining=-2000, 2 мс"],
        ["22", "Удаление доходной операции", "DELETE /api/transactions/7", "Операция удалена", "Пройдено", "2 мс"],
        ["23", "Удаление расходной операции", "DELETE /api/transactions/8", "Операция удалена", "Пройдено", "2 мс"],
        ["24", "Удаление категории", "DELETE /api/categories/41", "Категория удалена", "Пройдено", "2 мс"],
    ]

    matrix_rows = [
        ["№", "Требование", "Суть", "Критерий проверки", "Компоненты архитектуры", "Результат тестирования"],
        ["1", "Регистрация пользователя", "Система должна регистрировать нового пользователя", "Создание записи и возврат JWT", "Frontend register page, backend auth route, SQLite", "Выполнено"],
        ["2", "Вход пользователя", "Система должна выполнять аутентификацию", "Корректные учетные данные дают доступ", "Frontend login page, backend auth route", "Выполнено"],
        ["3", "Защита приватных маршрутов", "Без токена доступ запрещен", "Маршрут /api/auth/me возвращает 401", "JWT middleware", "Выполнено"],
        ["4", "Автосоздание стандартных категорий", "После регистрации у пользователя должен быть стартовый набор категорий", "Создается 10 категорий", "backend auth route, Prisma", "Выполнено"],
        ["5", "Просмотр категорий", "Пользователь получает список своих категорий", "GET /api/categories возвращает массив", "backend categories route", "Выполнено"],
        ["6", "Создание категории", "Пользователь может добавлять категории", "POST /api/categories возвращает 201", "frontend categories page, backend categories route", "Выполнено"],
        ["7", "Редактирование категории", "Пользователь может менять имя и иконку", "PUT /api/categories/:id изменяет данные", "frontend categories page, backend categories route", "Выполнено"],
        ["8", "Лимиты расходов", "Пользователь может задавать месячный лимит", "PUT /api/categories/:id/limit сохраняет значение", "frontend categories page, backend categories route", "Выполнено"],
        ["9", "Создание операции", "Пользователь может фиксировать доходы и расходы", "POST /api/transactions создает запись", "frontend transactions page, backend transactions route", "Выполнено"],
        ["10", "Редактирование операции", "Пользователь может изменять операцию", "PUT /api/transactions/:id обновляет запись", "frontend transactions page, backend transactions route", "Выполнено"],
        ["11", "Удаление операции", "Пользователь может удалять операцию", "DELETE /api/transactions/:id удаляет запись", "frontend transactions page, backend transactions route", "Выполнено"],
        ["12", "Фильтрация и пагинация", "Система должна поддерживать выборку операций по параметрам", "Фильтры типа, даты и страница применяются корректно", "frontend transactions page, backend transactions route", "Выполнено"],
        ["13", "Расчет баланса", "Система должна рассчитывать доходы, расходы и итоговый баланс", "GET /api/transactions/balance возвращает корректные агрегаты", "dashboard, backend transactions route", "Выполнено"],
        ["14", "Аналитика расходов по категориям", "Система должна строить структуру расходов", "GET /api/analytics/expenses-by-category возвращает суммы по категориям", "analytics page, backend analytics route", "Выполнено"],
        ["15", "Динамика доходов и расходов", "Система должна предоставлять временной тренд", "GET /api/analytics/income-expense-trend возвращает точки графика", "analytics page, backend analytics route", "Выполнено"],
        ["16", "Контроль превышения лимитов", "Система должна показывать категории с превышением лимита", "GET /api/analytics/limits-status возвращает isOverLimit=true при превышении", "dashboard, analytics page, backend analytics route", "Выполнено"],
        ["17", "Валидация входных данных", "Некорректные данные не должны приниматься системой", "Отрицательные суммы и дубликаты отклоняются", "Zod validation, backend routes", "Выполнено"],
        ["18", "Производительность API", "Базовые операции должны выполняться быстро", "24 проверенных запроса выполнены за 1-121 мс, среднее 14 мс", "backend API, SQLite", "Выполнено"],
        ["19", "Собираемость frontend", "Frontend должен успешно собираться", "npm run build завершен без ошибок", "Next.js frontend", "Выполнено"],
        ["20", "Собираемость backend", "Backend должен успешно компилироваться", "npm run build завершен без ошибок", "TypeScript backend", "Выполнено"],
    ]

    body.extend(
        [
            paragraph("ПРАКТИЧЕСКАЯ РАБОТА № 11", size=32, align="center", first_line=0, before=120, after=0, line=240, bold=True),
            paragraph("Подготовка к тестированию программного продукта", size=28, align="center", first_line=0, before=0, after=0, line=240),
            paragraph("Объект тестирования: веб-приложение finance-planner", size=28, align="center", first_line=0, before=0, after=0, line=240),
            paragraph("Выполнил: ____________________", size=28, align="right", first_line=0, before=0, after=0, line=240),
            paragraph("Группа: ____________________", size=28, align="right", first_line=0, before=0, after=0, line=240),
            paragraph("Проверил: ____________________", size=28, align="right", first_line=0, before=0, after=0, line=240),
            paragraph("МОСКВА 2026 г.", size=28, align="center", first_line=0, before=0, after=0, line=240),
            page_break_paragraph(),
            paragraph("1. Цель работы", size=32, align="left", first_line=0, before=851, after=567, line=240, bold=True),
            paragraph("Подготовить тестовые сценарии, выбрать инструменты тестирования, провести проверку функциональных и нефункциональных требований веб-приложения finance-planner, оформить результаты в виде чек-листа и дополненной матрицы требований."),
            paragraph("2. Основание для выполнения работы", size=32, align="left", first_line=0, before=851, after=567, line=240, bold=True),
            paragraph("Работа выполнена по заданию из файла 11прака_СиПИ.pdf. При анализе были учтены текстовые разделы PDF и сведения с иллюстраций: структура тестового сценария с обязательными атрибутами (номер, название, предусловия, шаги, ожидаемый результат) и классификация видов тестирования. На этой основе были сформированы тест-кейсы, чек-лист и матрица требований."),
            paragraph("3. Краткая характеристика программного продукта", size=32, align="left", first_line=0, before=851, after=567, line=240, bold=True),
            paragraph("Приложение finance-planner представляет собой fullstack-систему для учета личных финансов. Серверная часть реализована на Node.js и Express.js, для работы с базой данных используется Prisma ORM и SQLite. Клиентская часть реализована на Next.js и TypeScript. Основные функции системы: регистрация и вход пользователей, управление категориями расходов и доходов, установка месячных лимитов, ведение истории операций и построение аналитики."),
            paragraph("4. Выбранные инструменты тестирования", size=32, align="left", first_line=0, before=851, after=567, line=240, bold=True),
            table(tools_rows, [2200, 2200, 5238]),
            paragraph("5. Тестовое окружение", size=32, align="left", first_line=0, before=851, after=567, line=240, bold=True),
            table(env_rows, [3000, 6638]),
            paragraph("6. Тестовые случаи", size=32, align="left", first_line=0, before=851, after=567, line=240, bold=True),
            table(test_case_rows, [500, 2200, 2100, 2600, 2238]),
            paragraph("7. Чек-лист проведенного тестирования", size=32, align="left", first_line=0, before=851, after=567, line=240, bold=True),
            table(checklist_rows, [450, 1900, 2200, 1800, 1100, 2188]),
            paragraph("8. Дополненная матрица требований", size=32, align="left", first_line=0, before=851, after=567, line=240, bold=True),
            table(matrix_rows, [450, 1500, 2000, 2100, 2100, 1488]),
            paragraph("9. Результаты и анализ", size=32, align="left", first_line=0, before=851, after=567, line=240, bold=True),
            paragraph("В ходе практической работы было фактически выполнено 24 интеграционных сценария проверки backend API. Все 24 сценария завершились успешно. Проверены позитивные и негативные ветви авторизации, управление категориями, создание и изменение финансовых операций, расчет баланса, аналитические сводки и контроль лимитов."),
            paragraph("Дополнительно была выполнена сборка backend и frontend. Backend собрался без ошибок. Frontend также собрался успешно; зафиксированы только предупреждения о невозможности загрузки внешних шрифтов Google Fonts в офлайновой среде, что не привело к сбою сборки и не влияет на основную функциональность приложения."),
            paragraph("10. Вывод", size=32, align="left", first_line=0, before=851, after=567, line=240, bold=True),
            paragraph("В результате выполнения практической работы были подготовлены тестовые сценарии, выбран и обоснован набор инструментов тестирования, проведена проверка функциональных и нефункциональных требований приложения finance-planner, заполнен чек-лист тестирования и дополнена матрица требований. По результатам проверки приложение продемонстрировало корректную работу по всем проверенным сценариям. Итоговый результат тестирования: 24 из 24 тестов пройдены успешно."),
            paragraph("11. Приложение", size=32, align="left", first_line=0, before=851, after=567, line=240, bold=True),
            paragraph("Отдельно подготовлен файл с детальным планом написания автотестов на TypeScript, предназначенный для передачи другой нейросети: plan-testov-finance-planner.md."),
        ]
    )

    body.append(deepcopy(sect_pr))
    return doc


def main() -> None:
    template = Path("/Users/dimqvak/Downloads/СиПИ_9-10.docx")
    output = Path("/Users/dimqvak/Documents/code/finance-planner/docs/prakticheskaya-rabota-finance-planner-formatted.docx")

    with ZipFile(template) as template_zip:
        template_doc = ET.fromstring(template_zip.read("word/document.xml"))
        template_body = template_doc.find(w("body"))
        if template_body is None:
            raise RuntimeError("Template body not found")
        sect_pr = template_body.find(w("sectPr"))
        if sect_pr is None:
            raise RuntimeError("Template section properties not found")

        new_doc = build_document(sect_pr)
        xml_bytes = ET.tostring(new_doc, encoding="utf-8", xml_declaration=True)

        with ZipFile(output, "w", compression=ZIP_DEFLATED) as out_zip:
            for info in template_zip.infolist():
                data = template_zip.read(info.filename)
                if info.filename == "word/document.xml":
                    out_zip.writestr(info.filename, xml_bytes)
                else:
                    out_zip.writestr(info, data)


if __name__ == "__main__":
    main()
