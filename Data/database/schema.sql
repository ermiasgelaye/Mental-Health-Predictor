-- Data Engineering
DROP TABLE IF EXISTS mental_health CASCADE;
DROP TABLE IF EXISTS development_indicator CASCADE;

CREATE TABLE "mental_health" (
	"Timestamp" VARCHAR,
	"Age" VARCHAR,
    "Gender" VARCHAR,
	"Country" VARCHAR,
    "state" VARCHAR,
	"self_employed" VARCHAR,
	"family_history" VARCHAR,
	"treatment" VARCHAR,	
	"work_interfere" VARCHAR,	
	"no_employees" VARCHAR,	
	"remote_work" VARCHAR,	
	"tech_company" VARCHAR,
	"benefits" VARCHAR,	
	"care_options" VARCHAR,	
	"wellness_program" VARCHAR,	
	"seek_help" VARCHAR,
	"anonymity" VARCHAR,
	"leave"	VARCHAR,
	"mental_health_consequence"	VARCHAR,
	"phys_health_consequence" VARCHAR,
	"coworkers"	VARCHAR,
	"supervisor" VARCHAR,
	"mental_health_interview" VARCHAR,
	"phys_health_interview" VARCHAR,
	"mental_vs_physical" VARCHAR,	
	"obs_consequence" VARCHAR,	
	"comments" VARCHAR
);

CREATE TABLE "development_indicator" (
	"country_name" VARCHAR,
	"country_code" VARCHAR,
    "social_insurance" VARCHAR,
	"social_protection" VARCHAR,
    "unemployment_benefits" VARCHAR,
	"Educational_attainment" VARCHAR,
	"Female_employment" VARCHAR,
	"Male_employment" VARCHAR,	
	"GDP_per_capita" VARCHAR,	
	"Labor_force_rate_female" VARCHAR,	
	"Labor_force_rate_male" VARCHAR,	
	"Labor_force_total" VARCHAR,
	"Labour_force_with_basic_education" VARCHAR,	
	"Labour_force_with_basic_education_female" VARCHAR,	
	"life_expectancy_female" VARCHAR,	
	"Life_expectancy_total" VARCHAR,
	"Total_population" VARCHAR,
	"Suicide_mortality_rate_per_100k"	VARCHAR,
	"Suicide_mortality_rate_per_100k_female"	VARCHAR,
	"Suicide_mortality_rate_per_100k_male" VARCHAR,
	"unemployment_with_basic_education_total"	VARCHAR,
	"Unemployment_with_basic_education_female" VARCHAR,
	"Unemployment_with_basic_education_male" VARCHAR,
	"Year" VARCHAR
);











