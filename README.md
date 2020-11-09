# Mental Health vs Suicide: Predicting Suicide Rates from Mental Health Risk Factors

<img src="Image/worldmentalhealthday_16x9.jpg" height="500" width="900" />


## Background

Mental health has become one of the greatest global health concerns according to the WHO (World Health Organization, 2017). It has critically high and increasing prevalence, yielding severe health outcomes. 

It is observed that 1 in 4 adults suffer from a diagnosable mental illness in any given year (National Alliance on Mental Health, 2013). According to the WHO, there has been a 13% increase in mental health conditions overall from the last decade or so. Suicide rates on the other hand, have also [increased]( https://github.com/QianyueMa/Google-Health-Search-Project). Published statistics from the WHO indicates that about 800,000 people die every year due to suicide, not mentioned is how many more people have attempted or idealized suicide. This is especially true among teenagers from ages 15-19, suicide has become the third leading cause of death. 

Naturally their mental health concerns are important health risks that warrant further investigation. Considering the established strong correlation between suicide attempts or thoughts and underlying mental health conditions, our team believes it would be valuable **to study which personal and macroeconomic risk factors could predict the suicide rates on the national level and beyond**. 

- - -

## Project Objectives
### Main Question of Interest
This important health issue warrants further investigation. To predict national suicide rates from the observed personell and macroeconomic mental health risk factors, this project answers the following questions:

- What are the strongest predictors for suicide in different countries? Also, how to build machine learning models to study and predict our findings?
- How socio-economic and demographic factors affect the country’s yearly suicide rates?
- What causes the difference in suicide risks based on geographical location?

### Methodology & Objectives

We will conduct **statistical analysis about various risk factors**, **perform a set of data visualizations**, **build and test machine learning models**, in order to answer following **main questions**:

* Overall, what are the **strongest predictors for suicide* in different countries? Also, how to build **machine learning models* to study and predict our findings?
* On the **individual* level, how does the fact that a person had or has not sought for treatments influence their suicide risks? Also, why did they seek or not seek help for their mental health conditions? 
	* For example, the risk factors include the financial concerns (e.g., the insurance options offered, the company’s welfare packages), the fear of the consequences such as prejudice or employability if they disclose their mental health situations. It should be noted that those microeconomic factors are largely tied up to their country’s general macroeconomic factors as well. 
	* Those insights are generated from our [OSMI Mental Health in Tech Survey]( https://www.kaggle.com/ekwiecinska96/mental-health-in-techology-survey-2014-and-2016). 
* In terms of the **macroeconomic* factors, how does a country’s GDP/Income level average life expectancy, gender-specific fertility rate, education attainment, poverty rates and other socio-economic and demographic factors that affect the country’s yearly suicide rates? What causes the difference in suicide risks based on geographical location?
	* It is speculated that those mentioned national socio-economic factors determine the country’s holistic conservativeness level or attitude towards mental health topics. This attitude in turn can determine the government’s funding ratio on the mental health sector, as well as the severity of cultural stigma about mental illness. This then plays a larger role in contributing to people’s decision about whether or not seeking treatment for their illness will decrease their risk of suicide. 
	* Those findings are observed from the World Bank’s [World Development Indicators](https://databank.worldbank.org/source/world-development-indicators) database. 


## Data Sources

Our project uses the insights generated from [Mental Health in Tech Survey from Open Sourcing Mental Illness (OSMI)]( https://www.kaggle.com/ekwiecinska96/mental-health-in-techology-survey-2014-and-2016) and the data from the [World Development Indicators database](https://databank.worldbank.org/source/world-development-indicators) from the World Bank. 

### Data Source 1
The survey data from the [OSMI mental health in technology surveys)]( https://www.kaggle.com/ekwiecinska96/mental-health-in-techology-survey-2014-and-2016) is used to facilitate statistical analysis and to infer from its descriptive data representations.

The dataset contains 27 factors that could be segmented into **3 clusters of interests for our explanatory variables**. 

   - **Demographics**: age, gender, country, etc.
   - **Mental health services accessibility**: potential work interference, easiness to take a medical leave, insurance options, welfare benefits offered by employers, etc.
   - **Organizational cultures in the workplace in terms of openness about mental health**: easiness to discuss mental health among co-workers, fear of negative consequences caused by disclosure, etc.

This is the detailed factor list **directly obtained* from this survey dataset's [notebook here](https://www.kaggle.com/osmi/mental-health-in-tech-survey/home):
 <img src="Image/data_map.png" height="500" width="900" />
 
### Data Source 2
We have obtained the macro-socio-economic factors extracted from the [World Bank’s World Development Indicators database](https://databank.worldbank.org/source/world-development-indicators). This dataset looks into 246 countries of low- or middle- or high-income levels across the continents. 

The **selected factors** include: 
- Gender-specific suicide mortality rate (per 100,000 population)
- Gender-specific life expectancy at birth, total (years)
- Population, total
- Gender-specific labour force participation rate, female (% of female population ages 15+) (national estimate)
- Gender-specific labour force with advanced education (% of total working-age population with advanced education)
- Gender-specific employment to population ratio, 15+, total (%) (national estimate)
- Educational attainment, at least completed primary, population 25+ years, total (%) (cumulative)
- Coverage of unemployment benefits and ALMP (% of population)
- Coverage of social safety net programs (% of population)
- Coverage of social insurance programs (% of population)
- Multidimensional poverty index (scale 0-1)

## So... The Columns/Factors included in the New Composite Dataset:

**(N.B. to be finalized...)*

countries, years, age, gender, sought_treatment(=1, =0), fear_negative_consequences, workplace_openness, financial_concerns; gdp, life-expectancy, population, labour_participation (by gender), employment_to_population_ratio (by gender), adequate_educational_attainment, unemployment_benefits_coverage, social_insurance_coverage, social_safety_net_coverage, poverty_index, **suicide_rates (by gender)**

The `suicide mortality rate` is the dependent variable. The rest of the factors are independent variables. The `countries` is one of the key features.

- - -

## Architectural Diagram

<img src="Image/arctectured.png" height="500" width="900" />

## Deployment
The app is deployed in Heroku in order to access the page click the following link 
[Mind Your Health](https://mindyourhealth.herokuapp.com/) to explore our whole project

- https://mindyourhealth.herokuapp.com/

You can find our presentation [slide here](https://docs.google.com/presentation/d/1rNV9OyZRwMOkwW4LZzD71AB5QalhNDm-tOZPK2t0Pyc/edit)
- https://docs.google.com/presentation/d/1rNV9OyZRwMOkwW4LZzD71AB5QalhNDm-tOZPK2t0Pyc/edit

- - -
## Data Visualization and Analysis Processes

## Exploratory Data Analysis
After we conducted data cleanning, and loading we make Exploratory Data Analysis, and created a Dasboards by using Tableau. The Dashbord looks as follows:
<img src="Image/dashboard1" height="500" width="900" />

## Machine Learning Analysis
In this project we used various machine learning models, trained and tested the data to see the models ability to predict suicide mortality rate from various macro socio-economic factors in the national level. We used linear regression, logistic regression,support Vector Machine, decision tree and random forest models. We note differences in accuracy and effectiveness the models have towards the entire dataset. We noticed similar reappearing patterns that we knew would serve some importance when predicting suicide mortality rate from various macro socio-economic factors.

### Data Pre-Processing
The first step in our analysis was to clean and pre-process our dataset to make ready for our machine learning analysis. We cleaned, explored and visualized the data, the pre-processing normalizes the data for the ML analysis.

Before the ML analysis we tried to see if there was any coorelation between factors on Suicide mortality rate per 100,000 people.

<img src="/static/images/corrmatt.png" height="500" width="900" />

In the coorelation analysis we have found a positive (0.5) correlation between Suicide mortality rate, and coverage of social insurance programs.We have also found a negative(-0.5) correlation between suicide mortality rate and a percentage of the working population that possess basic education. Countries populated by people with a basic education negatively relate with the Suicide mortality rate. Which means that when more people join the education distribution, the suicide mortality rate decreases.
<img src="/static/images/social_insurance.png" height="500" width="900" />
<img src="/static/images/Labour_force_with_basic_education.png" height="500" width="900" />

## Machine Learning Models

### Part One: Linear regression, Decision Tree Regression, Support Vector Regression (SVR)

The first three models we executed are linear regression, decision tree regression, and support vector regression (SVR) to estimate the suicide mortality rate (continous dependent variable) on the estimator variables. The result from this three models showed that lower R-Squared value(R2), and higher mean square error(MSE). However, comparing the above three models decision tree regression explained the dependent variable(suicide mortality rate) better by the independent variable(predictor variables) with R-Squared value 0.24 and mean square error (MSE) 87.11.

[You can found the code here](https://github.com/ermiasgelaye/Mental-Health-Predictor/blob/master/machine_learning_analysis.ipynb)

<img src="/static/images/Linear_re.png" height="500" width="900" />

### Part Two: Logistic Regression, Support Vector Machine, Decision Tree,Random Forest
To test the stated models we grouped our continous dependent variable ("Suicide_mortality_rate_per_100k") into two groups, below and above the mean value (11.5). The suicide mortality rate above 11.5 would be high and below 11.5 would be low. Afterward we executed logistic regression, support Vector Machine, decision tree and random forest model.
The findings from these models showed that the models' accuracy to peredict the dependent variable is low, however comparing the models support vector machine explains the data very well with a 0.69 accuracy.

<img src="/static/images/compare.png" height="500" width="900" />

## Conclusion
In conclusion, mental helath and suicide are both important cases to study, because we continue to lose so many lives in this world at the hands of suicide. Our project focuses on identifying macro-level socio-economic factors that contribute to the problem. We believe that if socio-economic factors and polices towards mental health were changed, the issue would be solved easier. However, the issue is too complex and it all depends on the indvidual's own experience, meaning a collaborative and comprehensive approach is necessary to address this issue. Specific to this project we faced many challenges with the data quality (so many null values), we hope that the models applied a better outlook to assist in seeing more factors that can predict the problem.
 - - -

## References:
* World Health Organization. (2020). Mental Health. Retrieved October 31, 2020, from https://www.who.int/health-topics/mental-health#tab=tab_2
* World Health Organization. (2019). Suicide. Retrieved October 31, 2020, from https://www.who.int/news-room/fact-sheets/detail/suicide
* National Alliance on Mental Health. (2013). Mental Health Conditions. Retrieved October 31, 2020, from https://www.nami.org/Learn-More/Mental-Health-Conditions
* World Health Organization. (2017). Depression and other common mental disorders: global health estimates. Retrieved October 31, 2020, from https://www.who.int/mental_health/management/depression/prevalence_global_health_estimates/en/
* The World Bank, World Development Indicators (2020). Retrieved October 31, 2020, from https://databank.worldbank.org/source/world-development-indicators
