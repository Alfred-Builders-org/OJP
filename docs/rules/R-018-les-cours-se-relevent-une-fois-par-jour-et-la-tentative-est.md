---
id: R-018
title: Les cours se relèvent une fois par jour et la tentative est tracée même en échec
statement: Le relevé automatique est réservé une fois par jour par un verrou atomique ; la date de relevé enregistre la tentative et non le succès, de sorte qu'une source injoignable ne déclenche pas de nouvelle tentative avant le lendemain.
enforcement: constraint
surface: cours
priority: 1
d025_class: fenetre_temporelle
status: active
risk: risquee
source_feature: F-040
---
